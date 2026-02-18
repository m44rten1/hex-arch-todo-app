import type { UserId } from "../shared/index.js";

export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
