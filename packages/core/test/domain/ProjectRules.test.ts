import { describe, it, expect } from "vitest";
import {
  createProject,
  updateProject,
  archiveProject,
  unarchiveProject,
} from "../../src/domain/project/ProjectRules.js";
import type { Project } from "../../src/domain/project/Project.js";
import { projectId, workspaceId } from "../../src/domain/shared/Id.js";

const NOW = new Date("2025-06-15T10:00:00Z");

function activeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: projectId("proj-1"),
    workspaceId: workspaceId("ws-1"),
    name: "Work",
    color: null,
    archived: false,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe("createProject", () => {
  it("creates a valid project", () => {
    const result = createProject({
      id: projectId("proj-1"),
      workspaceId: workspaceId("ws-1"),
      name: "Work",
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("Work");
    expect(result.value.archived).toBe(false);
  });

  it("rejects empty name", () => {
    const result = createProject({
      id: projectId("proj-1"),
      workspaceId: workspaceId("ws-1"),
      name: "",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects name exceeding 100 characters", () => {
    const result = createProject({
      id: projectId("proj-1"),
      workspaceId: workspaceId("ws-1"),
      name: "a".repeat(101),
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("trims whitespace from name", () => {
    const result = createProject({
      id: projectId("proj-1"),
      workspaceId: workspaceId("ws-1"),
      name: "  Trimmed  ",
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("Trimmed");
  });
});

describe("updateProject", () => {
  it("updates name", () => {
    const later = new Date("2025-06-15T11:00:00Z");
    const result = updateProject(activeProject(), { name: "Personal", now: later });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe("Personal");
    expect(result.value.updatedAt).toEqual(later);
  });

  it("rejects invalid name", () => {
    const result = updateProject(activeProject(), { name: "", now: NOW });
    expect(result.ok).toBe(false);
  });
});

describe("archiveProject", () => {
  it("archives an active project", () => {
    const result = archiveProject(activeProject(), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.archived).toBe(true);
  });

  it("rejects archiving an already archived project", () => {
    const result = archiveProject(activeProject({ archived: true }), NOW);
    expect(result.ok).toBe(false);
  });
});

describe("unarchiveProject", () => {
  it("unarchives an archived project", () => {
    const result = unarchiveProject(activeProject({ archived: true }), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.archived).toBe(false);
  });

  it("rejects unarchiving an active project", () => {
    const result = unarchiveProject(activeProject(), NOW);
    expect(result.ok).toBe(false);
  });
});
