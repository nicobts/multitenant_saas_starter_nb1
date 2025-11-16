// Export all schemas
export * from "./tenants";
export * from "./users";
export * from "./tenant-members";
export * from "./projects";
export * from "./invitations";
export * from "./notifications";
export * from "./admin";

// Re-export relations
import { usersRelations } from "./users";
import { tenantMembersRelations } from "./tenant-members";
import { projectsRelations } from "./projects";
import { invitationsRelations } from "./invitations";
import { notificationsRelations, notificationPreferencesRelations } from "./notifications";
import { adminRolesRelations, featureFlagsRelations, impersonationLogsRelations } from "./admin";

export const relations = {
  usersRelations,
  tenantMembersRelations,
  projectsRelations,
  invitationsRelations,
  notificationsRelations,
  notificationPreferencesRelations,
  adminRolesRelations,
  featureFlagsRelations,
  impersonationLogsRelations,
};
