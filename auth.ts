import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import PostgresAdapter from "@auth/pg-adapter";
import { pool, query } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: "database" },
  // Vercel terminates TLS in front of the app and forwards the real host — trust it so
  // callback/redirect URLs resolve to the deployed domain instead of localhost.
  trustHost: true,
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM || "Makkah Apartment <onboarding@resend.dev>",
    }),
  ],
  events: {
    // The first person to ever sign in with ADMIN_EMAIL becomes admin automatically -- everyone
    // else lands as a plain 'partner' with no linked partner_id until an admin assigns their role
    // and partner from Settings -> Users. Without this, nobody could reach that settings page.
    async createUser({ user }) {
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      if (adminEmail && user.email?.toLowerCase() === adminEmail) {
        await query(`update users set role = 'admin' where id = $1`, [user.id]);
      }
    },
  },
});
