import { describe, it, expect, beforeEach } from "vitest";
import { tagId } from "@todo/core/domain/shared/index.js";
import { createTestApp, registerAndGetToken, type TestContext } from "./helpers.js";

describe("Tag routes", () => {
  let ctx: TestContext;
  let token: string;

  beforeEach(async () => {
    ctx = createTestApp();
    token = await registerAndGetToken(ctx);
  });

  function authHeaders() {
    return { authorization: `Bearer ${token}`, "content-type": "application/json" };
  }

  describe("POST /tags", () => {
    it("creates a tag and returns 201", async () => {
      ctx.idGen.setNextTagId(tagId("tag-1"));

      const res = await ctx.app.inject({
        method: "POST",
        url: "/tags",
        headers: authHeaders(),
        payload: { name: "urgent", color: "#ff0000" },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBe("tag-1");
      expect(body.name).toBe("urgent");
      expect(body.color).toBe("#ff0000");
    });

    it("returns 400 for empty name", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/tags",
        headers: authHeaders(),
        payload: { name: "" },
      });

      expect(res.statusCode).toBe(400);
    });

    it("returns 409 for duplicate name", async () => {
      await ctx.app.inject({
        method: "POST",
        url: "/tags",
        headers: authHeaders(),
        payload: { name: "urgent" },
      });

      const res = await ctx.app.inject({
        method: "POST",
        url: "/tags",
        headers: authHeaders(),
        payload: { name: "urgent" },
      });

      expect(res.statusCode).toBe(409);
    });
  });

  describe("GET /tags", () => {
    it("lists tags for workspace", async () => {
      await ctx.app.inject({
        method: "POST",
        url: "/tags",
        headers: authHeaders(),
        payload: { name: "bug" },
      });
      await ctx.app.inject({
        method: "POST",
        url: "/tags",
        headers: authHeaders(),
        payload: { name: "feature" },
      });

      const res = await ctx.app.inject({
        method: "GET",
        url: "/tags",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const tags = res.json();
      expect(tags).toHaveLength(2);
    });
  });

  describe("PATCH /tags/:id", () => {
    it("renames a tag", async () => {
      ctx.idGen.setNextTagId(tagId("tag-1"));
      await ctx.app.inject({
        method: "POST",
        url: "/tags",
        headers: authHeaders(),
        payload: { name: "urgent" },
      });

      const res = await ctx.app.inject({
        method: "PATCH",
        url: "/tags/tag-1",
        headers: authHeaders(),
        payload: { name: "critical" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().name).toBe("critical");
    });

    it("returns 409 when renaming to duplicate name", async () => {
      ctx.idGen.setNextTagId(tagId("tag-1"));
      await ctx.app.inject({ method: "POST", url: "/tags", headers: authHeaders(), payload: { name: "urgent" } });
      ctx.idGen.setNextTagId(tagId("tag-2"));
      await ctx.app.inject({ method: "POST", url: "/tags", headers: authHeaders(), payload: { name: "bug" } });

      const res = await ctx.app.inject({
        method: "PATCH",
        url: "/tags/tag-2",
        headers: authHeaders(),
        payload: { name: "urgent" },
      });

      expect(res.statusCode).toBe(409);
    });

    it("returns 404 for unknown tag", async () => {
      const res = await ctx.app.inject({
        method: "PATCH",
        url: "/tags/nonexistent",
        headers: authHeaders(),
        payload: { name: "x" },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("DELETE /tags/:id", () => {
    it("deletes a tag and returns 204", async () => {
      ctx.idGen.setNextTagId(tagId("tag-1"));
      await ctx.app.inject({
        method: "POST",
        url: "/tags",
        headers: authHeaders(),
        payload: { name: "urgent" },
      });

      const res = await ctx.app.inject({
        method: "DELETE",
        url: "/tags/tag-1",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(204);
    });

    it("deleted tag disappears from list", async () => {
      ctx.idGen.setNextTagId(tagId("tag-1"));
      await ctx.app.inject({ method: "POST", url: "/tags", headers: authHeaders(), payload: { name: "urgent" } });
      await ctx.app.inject({ method: "DELETE", url: "/tags/tag-1", headers: { authorization: `Bearer ${token}` } });

      const res = await ctx.app.inject({
        method: "GET",
        url: "/tags",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.json()).toHaveLength(0);
    });

    it("returns 404 for unknown tag", async () => {
      const res = await ctx.app.inject({
        method: "DELETE",
        url: "/tags/nonexistent",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
