import { hashPassword } from "better-auth/crypto";
import { nanoid } from "nanoid";
import prompts from "prompts";
// @ts-ignore
import { $ } from "bun";

async function run() {
  const response = await prompts([
    {
      type: 'text',
      name: 'username',
      message: 'Enter admin username:',
      initial: 'admin',
      validate: (v: string) => v.length > 0 ? true : 'Username is required'
    },
    {
      type: 'text',
      name: 'email',
      message: 'Enter admin email:',
      validate: (v: string) => v.includes('@') ? true : 'Invalid email'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter admin password (min 8 chars):',
      validate: (v: string) => v.length < 8 ? 'Too short' : true
    }
  ]);

  if (!response.email || !response.password) {
    console.log("Operation cancelled.");
    return;
  }

  const userId = nanoid();
  const hashedPassword = await hashPassword(response.password);
  const now = new Date().toISOString();
  
  // Define your DB binding name from wrangler.jsonc
  const DB_BINDING = "DB"; 

  // We wrap the SQL in a single string. 
  // NOTE: If your Drizzle schema uses CamelCase for D1 columns, 
  // adjust these (e.g., email_verified vs emailVerified).
  const sql = `
    INSERT INTO user (id, email, username, name, email_verified, role, created_at, updated_at) 
    VALUES ('${userId}', '${response.email}', '${response.username}', 'System Admin', 1, 'admin', '${now}', '${now}');
    
    INSERT INTO account (id, user_id, account_id, provider_id, password, created_at, updated_at) 
    VALUES ('${nanoid()}', '${userId}', '${response.email}', 'credential', '${hashedPassword}', '${now}', '${now}');
  `.replace(/\s+/g, ' ').trim();

  console.log("⏳ Hashing and executing local D1 command...");

  try {
    // Execute wrangler command directly. 
    // We use --local to let Wrangler find the hashed sqlite file for us.
    await $`bunx wrangler d1 execute ${DB_BINDING} --local --command ${sql}`;
    console.log("\n✅ Admin user and credentials seeded successfully.");
  } catch (error) {
    console.error("\n❌ Error executing D1 command. Ensure your table names and columns match your Drizzle schema.");
  }
}

run();
