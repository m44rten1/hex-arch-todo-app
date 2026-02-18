import { describe, it, expect, beforeEach } from "vitest";
import { taskId } from "@todo/core/domain/shared/index.js";
import { createTestApp, registerAndGetToken, type TestContext } from "./helpers.js";

describe("Task routes", () => {
  let ctx: TestContext;
  let token: string;

  beforeEach(async () => {
    ctx = createTestApp();
    token = await registerAndGetToken(ctx);
  });

  function authHeaders() {
    return { authorization: `Bearer ${token}`, "content-type": "application/json" };
  }

  describe("POST /tasks", () => {
    it("creates a task and returns 201", async () => {
      ctx.idGen.setNextTaskId(taskId("task-1"));

      const res = await ctx.app.inject({
        method: "POST",
        url: "/tasks",
        headers: authHeaders(),
        payload: { title: "Buy milk" },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBe("task-1");
      expect(body.title).toBe("Buy milk");
      expect(body.status).toBe("active");
    });

    it("returns 400 for missing title", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/tasks",
        headers: authHeaders(),
        payload: {},
      });

      expect(res.statusCode).toBe(400);
    });

    it("returns 400 for empty title", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/tasks",
        headers: authHeaders(),
        payload: { title: "" },
      });

      expect(res.statusCode).toBe(400);
    });

    it("returns 401 without token", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/tasks",
        headers: { "content-type": "application/json" },
        payload: { title: "No auth" },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("PATCH /tasks/:id", () => {
    it("updates a task", async () => {
      ctx.idGen.setNextTaskId(taskId("task-1"));
      await ctx.app.inject({
        method: "POST",
        url: "/tasks",
        headers: authHeaders(),
        payload: { title: "Original" },
      });

      const res = await ctx.app.inject({
        method: "PATCH",
        url: "/tasks/task-1",
        headers: authHeaders(),
        payload: { title: "Updated" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().title).toBe("Updated");
    });

    it("returns 404 for unknown task", async () => {
      const res = await ctx.app.inject({
        method: "PATCH",
        url: "/tasks/nonexistent",
        headers: authHeaders(),
        payload: { title: "x" },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("POST /tasks/:id/complete", () => {
    it("completes a task", async () => {
      ctx.idGen.setNextTaskId(taskId("task-1"));
      await ctx.app.inject({
        method: "POST",
        url: "/tasks",
        headers: authHeaders(),
        payload: { title: "Task" },
      });

      const res = await ctx.app.inject({
        method: "POST",
        url: "/tasks/task-1/complete",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe("completed");
    });

    it("returns 409 for already completed task", async () => {
      ctx.idGen.setNextTaskId(taskId("task-1"));
      await ctx.app.inject({ method: "POST", url: "/tasks", headers: authHeaders(), payload: { title: "Task" } });
      await ctx.app.inject({ method: "POST", url: "/tasks/task-1/complete", headers: { authorization: `Bearer ${token}` } });

      const res = await ctx.app.inject({
        method: "POST",
        url: "/tasks/task-1/complete",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(409);
    });
  });

  describe("POST /tasks/:id/uncomplete", () => {
    it("uncompletes a completed task", async () => {
      ctx.idGen.setNextTaskId(taskId("task-1"));
      await ctx.app.inject({ method: "POST", url: "/tasks", headers: authHeaders(), payload: { title: "Task" } });
      await ctx.app.inject({ method: "POST", url: "/tasks/task-1/complete", headers: { authorization: `Bearer ${token}` } });

      const res = await ctx.app.inject({
        method: "POST",
        url: "/tasks/task-1/uncomplete",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe("active");
    });
  });

  describe("DELETE /tasks/:id", () => {
    it("soft-deletes a task and returns 204", async () => {
      ctx.idGen.setNextTaskId(taskId("task-1"));
      await ctx.app.inject({ method: "POST", url: "/tasks", headers: authHeaders(), payload: { title: "Task" } });

      const res = await ctx.app.inject({
        method: "DELETE",
        url: "/tasks/task-1",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(204);
    });

    it("soft-deleted task no longer appears in inbox", async () => {
      ctx.idGen.setNextTaskId(taskId("task-1"));
      await ctx.app.inject({ method: "POST", url: "/tasks", headers: authHeaders(), payload: { title: "Task" } });
      await ctx.app.inject({ method: "DELETE", url: "/tasks/task-1", headers: { authorization: `Bearer ${token}` } });

      const res = await ctx.app.inject({
        method: "GET",
        url: "/inbox",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.json()).toHaveLength(0);
    });

    it("returns 404 when deleting an already deleted task", async () => {
      ctx.idGen.setNextTaskId(taskId("task-1"));
      await ctx.app.inject({ method: "POST", url: "/tasks", headers: authHeaders(), payload: { title: "Task" } });
      await ctx.app.inject({ method: "DELETE", url: "/tasks/task-1", headers: { authorization: `Bearer ${token}` } });

      const res = await ctx.app.inject({
        method: "DELETE",
        url: "/tasks/task-1",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("GET /inbox", () => {
    it("returns tasks without a project", async () => {
      ctx.idGen.setNextTaskId(taskId("task-1"));
      await ctx.app.inject({ method: "POST", url: "/tasks", headers: authHeaders(), payload: { title: "Inbox task" } });

      const res = await ctx.app.inject({
        method: "GET",
        url: "/inbox",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const tasks = res.json();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Inbox task");
    });
  });

  describe("GET /today", () => {
    it("returns tasks due today and overdue", async () => {
      ctx.idGen.setNextTaskId(taskId("t1"));
      await ctx.app.inject({
        method: "POST", url: "/tasks", headers: authHeaders(),
        payload: { title: "Due today", dueAt: "2025-06-15T17:00:00Z" },
      });

      ctx.idGen.setNextTaskId(taskId("t2"));
      await ctx.app.inject({
        method: "POST", url: "/tasks", headers: authHeaders(),
        payload: { title: "Overdue", dueAt: "2025-06-14T09:00:00Z" },
      });

      const res = await ctx.app.inject({
        method: "GET",
        url: "/today",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const view = res.json();
      expect(view.dueToday).toHaveLength(1);
      expect(view.overdue).toHaveLength(1);
    });
  });
});
