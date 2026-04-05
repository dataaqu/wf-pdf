import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "USER";
      name: string;
      username: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "ADMIN" | "USER";
    name: string;
    username: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "USER";
    username: string;
  }
}
