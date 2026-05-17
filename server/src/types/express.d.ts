import type { AppRole, ProjectRole } from "@team-task-manager/shared";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
        role: AppRole;
      };
      projectAccess?: {
        projectId: string;
        membershipRole: ProjectRole;
        isOwner: boolean;
      };
    }
  }
}

export {};
