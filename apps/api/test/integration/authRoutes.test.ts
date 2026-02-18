import { describe, it, expect, beforeEach } from "vitest";
import { createTestApp, type TestContext } from "./helpers.js";

describe("Auth routes", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = createTestApp();
  });

  describe("POST /auth/register", () => {
    it("registers a new user and returns token", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/auth/register",
        headers: { "content-type": "application/json" },
        payload: { email: "new@example.com", password: "password123" },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.token).toBeTruthy();
      expect(body.user.email).toBe("new@example.com");
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

    it("logs in with valid credentials", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/auth/login",
        headers: { "content-type": "application/json" },
        payload: { email: "user@example.com", password: "password123" },
      });

      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.token).toBeTruthy();
      expect(body.user.email).toBe("user@example.com");
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

    it("allows access with valid token from registration", async () => {
      const registerRes = await ctx.app.inject({
        method: "POST",
        url: "/auth/register",
        headers: { "content-type": "application/json" },
        payload: { email: "auth@example.com", password: "password123" },
      });

      const { token } = registerRes.json() as { token: string };

      const res = await ctx.app.inject({
        method: "GET",
        url: "/inbox",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
    });

    it("health endpoint is public", async () => {
      const res = await ctx.app.inject({ method: "GET", url: "/health" });
      expect(res.statusCode).toBe(200);
    });
  });
});
