import "dotenv/config";
import pool from "./db/connection.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

const username = process.env.ADMIN_USER;
const password = process.env.ADMIN_PASSWORD;

if (!username || !password) {
  console.error("ADMIN_USER and ADMIN_PASSWORD must be set in .env");
  process.exit(1);
}

try {
  const existing = await pool.query(
    "SELECT id FROM users WHERE username = $1",
    [username]
  );

  if (existing.rows.length > 0) {
    // Ensure existing user is marked admin
    await pool.query("UPDATE users SET is_admin = TRUE WHERE username = $1", [
      username,
    ]);
    console.log(`Admin user "${username}" already exists, ensured is_admin = true.`);
  } else {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await pool.query(
      "INSERT INTO users (username, email, password_hash, is_admin) VALUES ($1, $2, $3, TRUE)",
      [username, `${username}@admin.local`, passwordHash]
    );
    console.log(`Admin user "${username}" created.`);
  }
} catch (err) {
  console.error("Error seeding admin user:", err);
  process.exit(1);
}

await pool.end();
