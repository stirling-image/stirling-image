import type { Permission, Role } from "@ashim/shared";
import type { FastifyReply, FastifyRequest } from "fastify";
import { getAuthUser } from "./plugins/auth.js";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "tools:use",
    "files:own",
    "files:all",
    "apikeys:own",
    "apikeys:all",
    "pipelines:own",
    "pipelines:all",
    "settings:read",
    "settings:write",
    "users:manage",
    "teams:manage",
    "branding:manage",
  ],
  user: ["tools:use", "files:own", "apikeys:own", "pipelines:own", "settings:read"],
};

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return getPermissions(role).includes(permission);
}

export function requirePermission(permission: Permission) {
  return (request: FastifyRequest, reply: FastifyReply) => {
    const user = getAuthUser(request);
    if (!user) {
      reply.status(401).send({ error: "Authentication required", code: "AUTH_REQUIRED" });
      return null;
    }
    if (!hasPermission(user.role as Role, permission)) {
      reply.status(403).send({ error: "Insufficient permissions", code: "FORBIDDEN" });
      return null;
    }
    return user;
  };
}
