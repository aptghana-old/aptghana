import type { DefaultSession } from "next-auth";

export type AdminRole = "super_admin" | "manager" | "editor" | "viewer" | "support";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      role: AdminRole;
      permissions: string[];
      mfaEnabled: boolean;
      lastActivityAt: number;
    } & Omit<DefaultSession["user"], "id" | "email" | "name" | "image">;
  }

  interface User {
    role?: AdminRole;
    permissions?: string[];
    mfaEnabled?: boolean;
    rememberMe?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AdminRole;
    permissions: string[];
    mfaEnabled: boolean;
    lastActivityAt: number;
    rememberMe?: boolean;
  }
}
