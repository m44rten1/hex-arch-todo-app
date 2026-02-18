import type { PasswordHasher } from "@todo/core/application/ports/outbound/PasswordHasher.js";

export class StubPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}
