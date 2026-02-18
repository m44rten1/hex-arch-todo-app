import type { User } from "@todo/core/domain/user/User.js";
import type { Workspace } from "@todo/core/domain/workspace/Workspace.js";
import type { UserRegistrationStore } from "@todo/core/application/ports/outbound/UserRegistrationStore.js";
import type { InMemoryUserRepo } from "./InMemoryUserRepo.js";
import type { InMemoryWorkspaceRepo } from "./InMemoryWorkspaceRepo.js";

export class InMemoryUserRegistrationStore implements UserRegistrationStore {
  private readonly userRepo: InMemoryUserRepo;
  private readonly workspaceRepo: InMemoryWorkspaceRepo;

  constructor(userRepo: InMemoryUserRepo, workspaceRepo: InMemoryWorkspaceRepo) {
    this.userRepo = userRepo;
    this.workspaceRepo = workspaceRepo;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.userRepo.findByEmail(email)) !== null;
  }

  async save(user: User, workspace: Workspace): Promise<void> {
    await this.userRepo.save(user);
    await this.workspaceRepo.save(workspace);
  }
}
