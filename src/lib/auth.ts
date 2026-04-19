import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username, admin } from "better-auth/plugins";
import { getDb } from "@/db";
import * as schema from "@/db/schema";

export const getAuth = (env: any) => {
  const db = getDb(env.DB);
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    debug: false,
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      username(),
      admin(),
    ],
  });
};

/*
// required to run better-auth cli
// bun x auth@latest generate --config ./src/lib/auth.ts --output ./src/db/schema.ts --adapter drizzle --dialect sqlite

export const auth = betterAuth({
  database: drizzleAdapter({}, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username(),
    admin(),
  ]
})
*/
