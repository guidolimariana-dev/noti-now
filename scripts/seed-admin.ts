
import { hashPassword } from "better-auth/crypto";
import { nanoid } from "nanoid";
// @ts-ignore
import { $ } from "bun";

async function run() {
  const username = "admin";
  const email = "admin@admin.com";
  const password = "admin"; // You should probably change this later

  const userId = nanoid();
  const hashedPassword = await hashPassword(password);
  const now = Date.now();
  
  const DB_BINDING = "base_admin"; 

  const sqlUser = `INSERT INTO user (id, email, username, name, email_verified, role, created_at, updated_at) VALUES ('${userId}', '${email}', '${username}', 'System Admin', 1, 'admin', ${now}, ${now});`;
  const sqlAccount = `INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at) VALUES ('${nanoid()}', '${userId}', '${email}', 'credential', '${hashedPassword}', ${now}, ${now});`;

  console.log("⏳ Seeding admin user into local D1...");

  try {
    await $`bunx wrangler d1 execute ${DB_BINDING} --local --command ${sqlUser}`;
    await $`bunx wrangler d1 execute ${DB_BINDING} --local --command ${sqlAccount}`;
    console.log("\n✅ Admin user created successfully.");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
  } catch (error) {
    console.error("\n❌ Error creating admin user:", error);
  }
}

run();
