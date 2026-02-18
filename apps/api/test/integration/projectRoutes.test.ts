import { describe, it, expect, beforeEach } from "vitest";
import { projectId, taskId } from "@todo/core/domain/shared/index.js";
import { createTestApp, registerAndGetToken, type TestContext } from "./helpers.js";

describe("Project routes", () => {
  let ctx: TestContext;
  let token: string;

  beforeEach(async () => {
    ctx = createTestApp();
    token = await registerAndGetToken(ctx);
  });

  function authHeaders() {
    return { authorization: `Bearer ${token}`, "content-type": "application/json" };
  }

  describe("POST /projects", () => {
    it("creates a project and returns 201", async () => {
      ctx.idGen.setNextProjectId(projectId("proj-1"));

      const res = await ctx.app.inject({
        method: "POST",
        url: "/projects",
        headers: authHeaders(),
        payload: { name: "Work" },
      });

      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBe("proj-1");
      expect(body.name).toBe("Work");
    });

    it("returns 400 for empty name", async () => {
      const res = await ctx.app.inject({
        method: "POST",
        url: "/projects",
        headers: authHeaders(),
        payload: { name: "" },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("GET /projects", () => {
    it("lists projects for workspace", async () => {
      ctx.idGen.setNextProjectId(projectId("proj-1"));
      await ctx.app.inject({
        method: "POST",
        url: "/projects",
        headers: authHeaders(),
        payload: { name: "Work" },
      });

      const res = await ctx.app.inject({
        method: "GET",
        url: "/projects",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const projects = res.json();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe("Work");
    });
  });

  describe("GET /projects/:id", () => {
    it("returns project with its tasks", async () => {
      ctx.idGen.setNextProjectId(projectId("proj-1"));
      await ctx.app.inject({
        method: "POST",
        url: "/projects",
        headers: authHeaders(),
        payload: { name: "Work" },
      });

      ctx.idGen.setNextTaskId(taskId("task-1"));
      await ctx.app.inject({
        method: "POST",
        url: "/tasks",
        headers: authHeaders(),
        payload: { title: "Project task", projectId: "proj-1" },
      });

      const res = await ctx.app.inject({
        method: "GET",
        url: "/projects/proj-1",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      const detail = res.json();
      expect(detail.project.name).toBe("Work");
      expect(detail.tasks).toHaveLength(1);
      expect(detail.tasks[0].title).toBe("Project task");
    });

    it("returns 404 for unknown project", async () => {
      const res = await ctx.app.inject({
        method: "GET",
        url: "/projects/nonexistent",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("PATCH /projects/:id", () => {
    it("renames a project", async () => {
      ctx.idGen.setNextProjectId(projectId("proj-1"));
      await ctx.app.inject({ method: "POST", url: "/projects", headers: authHeaders(), payload: { name: "Work" } });

      const res = await ctx.app.inject({
        method: "PATCH",
        url: "/projects/proj-1",
        headers: authHeaders(),
        payload: { name: "Personal" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().name).toBe("Personal");
    });

    it("updates color", async () => {
      ctx.idGen.setNextProjectId(projectId("proj-1"));
      await ctx.app.inject({ method: "POST", url: "/projects", headers: authHeaders(), payload: { name: "Work" } });

      const res = await ctx.app.inject({
        method: "PATCH",
        url: "/projects/proj-1",
        headers: authHeaders(),
        payload: { color: "#ff0000" },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().color).toBe("#ff0000");
    });

    it("returns 404 for unknown project", async () => {
      const res = await ctx.app.inject({
        method: "PATCH",
        url: "/projects/nonexistent",
        headers: authHeaders(),
        payload: { name: "x" },
      });

      expect(res.statusCode).toBe(404);
    });
  });

  describe("POST /projects/:id/archive", () => {
    it("archives a project", async () => {
      ctx.idGen.setNextProjectId(projectId("proj-1"));
      await ctx.app.inject({ method: "POST", url: "/projects", headers: authHeaders(), payload: { name: "Work" } });

      const res = await ctx.app.inject({
        method: "POST",
        url: "/projects/proj-1/archive",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().archived).toBe(true);
    });

    it("returns 409 for already archived project", async () => {
      ctx.idGen.setNextProjectId(projectId("proj-1"));
      await ctx.app.inject({ method: "POST", url: "/projects", headers: authHeaders(), payload: { name: "Work" } });
      await ctx.app.inject({ method: "POST", url: "/projects/proj-1/archive", headers: { authorization: `Bearer ${token}` } });

      const res = await ctx.app.inject({
        method: "POST",
        url: "/projects/proj-1/archive",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(409);
    });

    it("archived project disappears from list", async () => {
      ctx.idGen.setNextProjectId(projectId("proj-1"));
      await ctx.app.inject({ method: "POST", url: "/projects", headers: authHeaders(), payload: { name: "Work" } });
      await ctx.app.inject({ method: "POST", url: "/projects/proj-1/archive", headers: { authorization: `Bearer ${token}` } });

      const res = await ctx.app.inject({
        method: "GET",
        url: "/projects",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.json()).toHaveLength(0);
    });
  });

  describe("POST /projects/:id/unarchive", () => {
    it("unarchives an archived project", async () => {
      ctx.idGen.setNextProjectId(projectId("proj-1"));
      await ctx.app.inject({ method: "POST", url: "/projects", headers: authHeaders(), payload: { name: "Work" } });
      await ctx.app.inject({ method: "POST", url: "/projects/proj-1/archive", headers: { authorization: `Bearer ${token}` } });

      const res = await ctx.app.inject({
        method: "POST",
        url: "/projects/proj-1/unarchive",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(200);
      expect(res.json().archived).toBe(false);
    });

    it("returns 409 for non-archived project", async () => {
      ctx.idGen.setNextProjectId(projectId("proj-1"));
      await ctx.app.inject({ method: "POST", url: "/projects", headers: authHeaders(), payload: { name: "Work" } });

      const res = await ctx.app.inject({
        method: "POST",
        url: "/projects/proj-1/unarchive",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(409);
    });
  });

  describe("DELETE /projects/:id", () => {
    it("deletes a project and returns 204", async () => {
      ctx.idGen.setNextProjectId(projectId("proj-1"));
      await ctx.app.inject({ method: "POST", url: "/projects", headers: authHeaders(), payload: { name: "Work" } });

      const res = await ctx.app.inject({
        method: "DELETE",
        url: "/projects/proj-1",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(204);
    });

    it("deleted project disappears from list", async () => {
      ctx.idGen.setNextProjectId(projectId("proj-1"));
      await ctx.app.inject({ method: "POST", url: "/projects", headers: authHeaders(), payload: { name: "Work" } });
      await ctx.app.inject({ method: "DELETE", url: "/projects/proj-1", headers: { authorization: `Bearer ${token}` } });

      const res = await ctx.app.inject({
        method: "GET",
        url: "/projects",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.json()).toHaveLength(0);
    });

    it("returns 404 for unknown project", async () => {
      const res = await ctx.app.inject({
        method: "DELETE",
        url: "/projects/nonexistent",
        headers: { authorization: `Bearer ${token}` },
      });

      expect(res.statusCode).toBe(404);
    });
  });
});
