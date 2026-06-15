import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    emailVerified: boolean;
    mfaEnabled:    boolean;
    accountType:   string;
    rememberMe?:   boolean;
  }
  interface Session {
    user: {
      id:            string;
      emailVerified: boolean;
      mfaEnabled:    boolean;
      accountType:   string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id:            string;
    emailVerified: boolean;
    mfaEnabled:    boolean;
    accountType:   string;
  }
}
