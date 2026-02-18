import { describe, it, expect } from "vitest";
import { validateEmail, validatePassword, createUser } from "../../src/domain/user/UserRules.js";
import { userId } from "../../src/domain/shared/Id.js";

const NOW = new Date("2025-06-15T10:00:00Z");

describe("validateEmail", () => {
  it("accepts a valid email", () => {
    const result = validateEmail("test@example.com");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe("test@example.com");
  });

  it("normalizes to lowercase and trims", () => {
    const result = validateEmail("  Test@EXAMPLE.COM  ");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toBe("test@example.com");
  });

  it("rejects empty string", () => {
    const result = validateEmail("");
    expect(result.ok).toBe(false);
  });

  it("rejects string without @", () => {
    const result = validateEmail("notanemail");
    expect(result.ok).toBe(false);
  });

  it("rejects string with spaces in local part", () => {
    const result = validateEmail("bad email@example.com");
    expect(result.ok).toBe(false);
  });
});

describe("validatePassword", () => {
  it("accepts password with 8+ characters", () => {
    const result = validatePassword("abcdefgh");
    expect(result.ok).toBe(true);
  });

  it("rejects password shorter than 8 characters", () => {
    const result = validatePassword("short");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.field).toBe("password");
  });

  it("rejects empty password", () => {
    const result = validatePassword("");
    expect(result.ok).toBe(false);
  });
});

describe("createUser", () => {
  it("creates a user with normalized email", () => {
    const result = createUser({
      id: userId("u-1"),
      email: "Test@Example.COM",
      passwordHash: "hashed",
      now: NOW,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.email).toBe("test@example.com");
    expect(result.value.passwordHash).toBe("hashed");
  });

  it("rejects invalid email", () => {
    const result = createUser({
      id: userId("u-1"),
      email: "bad",
      passwordHash: "hashed",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });
});
