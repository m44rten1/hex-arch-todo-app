import { describe, it, expect, beforeEach } from "vitest";
import { taskId } from "@todo/core/domain/shared/index.js";
import { createTestApp, registerAndGetToken, type TestContext } from "./helpers.js";

describe("Error response contract", () => {
  let ctx: TestContext;
  let token: string;

  beforeEach(async () => {
    ctx = createTestApp();
    token = await registerAndGetToken(ctx);
  });

  function auth() {
    return { authorization: `Bearer ${token}`, "content-type": "application/json" };
  }

  it("VALIDATION_ERROR (400) includes code, message, and field", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/tasks",
      headers: auth(),
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body).toHaveProperty("code", "VALIDATION_ERROR");
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
  });

  it("NOT_FOUND (404) includes code and message", async () => {
    const res = await ctx.app.inject({
      method: "PATCH",
      url: "/tasks/nonexistent",
      headers: auth(),
      payload: { title: "x" },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body).toHaveProperty("code", "NOT_FOUND");
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
  });

  it("CONFLICT (409) includes code and message", async () => {
    ctx.idGen.setNextTaskId(taskId("t1"));
    await ctx.app.inject({ method: "POST", url: "/tasks", headers: auth(), payload: { title: "Task" } });
    await ctx.app.inject({ method: "POST", url: "/tasks/t1/complete", headers: { authorization: `Bearer ${token}` } });

    const res = await ctx.app.inject({
      method: "POST",
      url: "/tasks/t1/complete",
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body).toHaveProperty("code", "CONFLICT");
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
  });

  it("UNAUTHORIZED (401) includes code and message for missing token", async () => {
    const res = await ctx.app.inject({
      method: "GET",
      url: "/inbox",
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body).toHaveProperty("code", "UNAUTHORIZED");
    expect(body).toHaveProperty("message");
    expect(typeof body.message).toBe("string");
  });

  it("UNAUTHORIZED (401) includes code and message for invalid credentials", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/auth/login",
      headers: { "content-type": "application/json" },
      payload: { email: "nobody@example.com", password: "password123" },
    });

    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body).toHaveProperty("code", "UNAUTHORIZED");
    expect(body).toHaveProperty("message");
  });

  it("NOT_FOUND (404) for unknown routes", async () => {
    const res = await ctx.app.inject({
      method: "GET",
      url: "/nonexistent-route",
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body).toHaveProperty("code", "NOT_FOUND");
    expect(body).toHaveProperty("message");
  });

  it("NOT_FOUND (404) for recurrence query on task without recurrence", async () => {
    ctx.idGen.setNextTaskId(taskId("t1"));
    await ctx.app.inject({ method: "POST", url: "/tasks", headers: auth(), payload: { title: "Task" } });

    const res = await ctx.app.inject({
      method: "GET",
      url: "/tasks/t1/recurrence",
      headers: auth(),
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body).toHaveProperty("code", "NOT_FOUND");
    expect(body).toHaveProperty("message");
  });

  it("CONFLICT (409) for duplicate registration", async () => {
    const res = await ctx.app.inject({
      method: "POST",
      url: "/auth/register",
      headers: { "content-type": "application/json" },
      payload: { email: "test@example.com", password: "password123" },
    });

    expect(res.statusCode).toBe(409);
    const body = res.json();
    expect(body).toHaveProperty("code", "CONFLICT");
    expect(body).toHaveProperty("message");
  });
});
