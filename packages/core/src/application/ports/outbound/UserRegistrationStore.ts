import type { User } from "../../../domain/user/User.js";
import type { Workspace } from "../../../domain/workspace/Workspace.js";

export interface UserRegistrationStore {
  existsByEmail(email: string): Promise<boolean>;
  save(user: User, workspace: Workspace): Promise<void>;
}
