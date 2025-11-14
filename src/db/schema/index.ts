// Export all schemas
export * from "./tenants";
export * from "./users";
export * from "./tenant-members";
export * from "./projects";
export * from "./invitations";

// Re-export relations
import { usersRelations } from "./users";
import { tenantMembersRelations } from "./tenant-members";
import { projectsRelations } from "./projects";
import { invitationsRelations } from "./invitations";

export const relations = {
  usersRelations,
  tenantMembersRelations,
  projectsRelations,
  invitationsRelations,
};
