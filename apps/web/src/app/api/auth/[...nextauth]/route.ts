import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: { label: "Email" }, password: { label: "Password", type: "password" } },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const rows = await db.select().from(users).where(eq(users.email, creds.email));
        const u = rows[0];
        if (!u) return null;
        const ok = await bcrypt.compare(creds.password, u.passwordHash);
        if (!ok) return null;
        return { id: String(u.id), email: u.email, name: `${u.firstName} ${u.lastName}`, role: u.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) { if (user) token.role = (user as any).role; return token; },
    async session({ session, token }) { (session as any).role = token.role; return session; },
    async redirect({ url, baseUrl }) { if (url.startsWith("/")) return baseUrl + url; return baseUrl + "/dashboard"; },
  },
});

export { handler as GET, handler as POST };
