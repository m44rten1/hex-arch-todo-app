import { describe, it, expect, beforeEach } from "vitest";
import type { OutgoingHttpHeaders } from "http";
import { createTestApp, type TestContext } from "./helpers.js";

function extractTokenCookie(res: { headers: OutgoingHttpHeaders }): string | undefined {
  const setCookie = res.headers["set-cookie"];
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : typeof setCookie === "string" ? setCookie : undefined;
  const match = cookieStr?.match(/token=([^;]+)/);
  return match?.[1];
}

describe("Auth routes", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestApp();
  });

  describe("POST /auth/register", () => {
    it("registers a new user and sets token cookie", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/auth/register",
        headers: { "content-type": "application/json" },
        payload: { email: "new@example.com", password: "password123" },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.user.email).toBe("new@example.com");
      expect(extractTokenCookie(res)).toBeTruthy();
    });

    it("rejects duplicate email", async () => {
      await ctx.app.inject({
        method: "POST",
        url: "/auth/register",
        headers: { "content-type": "application/json" },
        payload: { email: "dup@example.com", password: "password123" },
      });

      const res = await ctx.app.inject({
        method: "POST",
        url: "/auth/register",
        headers: { "content-type": "application/json" },
        payload: { email: "dup@example.com", password: "otherpass123" },
      });

      expect(res.statusCode).toBe(409);
    });

    it("rejects short password", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/auth/register",
        headers: { "content-type": "application/json" },
        payload: { email: "test@example.com", password: "short" },
      });

      expect(res.statusCode).toBe(400);
    });

    it("rejects invalid email", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/auth/register",
        headers: { "content-type": "application/json" },
        payload: { email: "bademail", password: "password123" },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await ctx.app.inject({
        method: "POST",
        url: "/auth/register",
        headers: { "content-type": "application/json" },
        payload: { email: "user@example.com", password: "password123" },
      });
    });

    it("logs in with valid credentials and sets token cookie", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/auth/login",
        headers: { "content-type": "application/json" },
        payload: { email: "user@example.com", password: "password123" },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.user.email).toBe("user@example.com");
      expect(extractTokenCookie(res)).toBeTruthy();
    });

    it("rejects wrong password", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/auth/login",
        headers: { "content-type": "application/json" },
        payload: { email: "user@example.com", password: "wrongpassword" },
      });

      expect(res.statusCode).toBe(401);
    });

    it("rejects unknown email", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/auth/login",
        headers: { "content-type": "application/json" },
        payload: { email: "nobody@example.com", password: "password123" },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("POST /auth/logout", () => {
    it("clears the token cookie", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/auth/logout",
      });

      expect(res.statusCode).toBe(200);
      const setCookie = res.headers["set-cookie"];
      const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
      expect(cookieStr).toContain("token=");
      expect(cookieStr).toContain("Max-Age=0");
    });
  });

  describe("Protected routes require auth", () => {
    it("returns 401 for /inbox without token", async () => {
      const res = await ctx.app.inject({ method: "GET", url: "/inbox" });
      expect(res.statusCode).toBe(401);
    });

    it("returns 401 for /tasks with invalid token", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/tasks",
        headers: { authorization: "Bearer invalid-token", "content-type": "application/json" },
        payload: { title: "Test" },
      });
      expect(res.statusCode).toBe(401);
    });

    it("allows access with valid token from registration via Bearer header", async () => {
      const registerRes = await ctx.app.inject({
        method: "POST",
        url: "/auth/register",
        headers: { "content-type": "application/json" },
        payload: { email: "auth@example.com", password: "password123" },
      });

      const token = extractTokenCookie(registerRes);

      const res = await ctx.app.inject({
        method: "GET",
        url: "/inbox",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
    });

    it("allows access with valid token from registration via cookie", async () => {
      const registerRes = await ctx.app.inject({
        method: "POST",
        url: "/auth/register",
        headers: { "content-type": "application/json" },
        payload: { email: "auth@example.com", password: "password123" },
      });

      const token = extractTokenCookie(registerRes);

      const res = await ctx.app.inject({
        method: "GET",
        url: "/inbox",
        cookies: { token: token! },
      });

      expect(res.statusCode).toBe(200);
    });

    it("GET /auth/me returns current user", async () => {
      const registerRes = await ctx.app.inject({
        method: "POST",
        url: "/auth/register",
        headers: { "content-type": "application/json" },
        payload: { email: "me@example.com", password: "password123" },
      });

      const token = extractTokenCookie(registerRes);

      const res = await ctx.app.inject({
        method: "GET",
        url: "/auth/me",
        cookies: { token: token! },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.user.email).toBe("me@example.com");
    });

    it("health endpoint is public", async () => {
      const res = await ctx.app.inject({ method: "GET", url: "/health" });
      expect(res.statusCode).toBe(200);
    });
  });
});
