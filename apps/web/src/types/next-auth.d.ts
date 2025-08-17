import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    role?: "super_admin" | "admin" | "operator";
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    role?: "super_admin" | "admin" | "operator";
  }
}
