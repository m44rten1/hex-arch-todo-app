import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import { createPgTestApp, type PgTestContext } from "./helpers.js";

function extractTokenFromSetCookie(setCookieHeader: string | string[] | undefined): string {
  const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
  const match = cookieStr?.match(/token=([^;]+)/);
  if (!match?.[1]) {
    throw new Error("No token cookie found");
  }
  return match[1];
}

describe("Postgres-backed integration flows", () => {
  let ctx: PgTestContext;

  beforeAll(async () => {
    ctx = await createPgTestApp();
  }, 120_000);

  beforeEach(async () => {
    await ctx.reset();
  });

  afterAll(async () => {
    await ctx.stop();
  });

  async function registerAndGetToken(email: string, password: string): Promise<string> {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/auth/register",
      headers: { "content-type": "application/json" },
      payload: { email, password },
    });

    expect(res.statusCode).toBe(201);
    return extractTokenFromSetCookie(res.headers["set-cookie"]);
  }

  it("auth roundtrip works against Postgres (register -> me -> login)", async () => {
    const email = "pg-auth@example.com";
    const password = "password123";

    const token = await registerAndGetToken(email, password);

    const meRes = await ctx.app.inject({
      method: "GET",
      url: "/auth/me",
      cookies: { token },
    });

    expect(meRes.statusCode).toBe(200);
    expect(meRes.json().user.email).toBe(email);

    const loginRes = await ctx.app.inject({
      method: "POST",
      url: "/auth/login",
      headers: { "content-type": "application/json" },
      payload: { email, password },
    });

    expect(loginRes.statusCode).toBe(200);
    expect(extractTokenFromSetCookie(loginRes.headers["set-cookie"])).toBeTruthy();
  });

  it("task lifecycle persists correctly in Postgres", async () => {
    const token = await registerAndGetToken("pg-tasks@example.com", "password123");
    const authHeaders = { authorization: `Bearer ${token}`, "content-type": "application/json" };

    const createRes = await ctx.app.inject({
      method: "POST",
      url: "/tasks",
      headers: authHeaders,
      payload: { title: "Postgres task" },
    });

    expect(createRes.statusCode).toBe(201);
    const task = createRes.json();
    expect(task.title).toBe("Postgres task");

    const patchRes = await ctx.app.inject({
      method: "PATCH",
      url: `/tasks/${task.id}`,
      headers: authHeaders,
      payload: { title: "Updated title" },
    });

    expect(patchRes.statusCode).toBe(200);
    expect(patchRes.json().title).toBe("Updated title");

    const completeRes = await ctx.app.inject({
      method: "POST",
      url: `/tasks/${task.id}/complete`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(completeRes.statusCode).toBe(200);
    expect(completeRes.json().status).toBe("completed");

    const completedRes = await ctx.app.inject({
      method: "GET",
      url: "/inbox/completed",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(completedRes.statusCode).toBe(200);
    expect(completedRes.json()).toHaveLength(1);
    expect(completedRes.json()[0].title).toBe("Updated title");

    const deleteRes = await ctx.app.inject({
      method: "DELETE",
      url: `/tasks/${task.id}`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(deleteRes.statusCode).toBe(204);

    const completedAfterDeleteRes = await ctx.app.inject({
      method: "GET",
      url: "/inbox/completed",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(completedAfterDeleteRes.statusCode).toBe(200);
    expect(completedAfterDeleteRes.json()).toHaveLength(0);
  });
});
