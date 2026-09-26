// Creates (or promotes) an administrator account.
// Usage: npm run create-admin -- --email admin@kormopulse.com --password "long-random-password" --name "Site Admin"
import dotenv from "dotenv";
import readline from "readline";
import mongoose from "mongoose";
import { connectDB } from "../db/db.js";
import { User } from "../models/user.model.js";

dotenv.config();

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      args[key] = value;
    }
  }
  return args;
};

const ask = (question, { hidden = false } = {}) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      // Best-effort password masking; still visible to anyone with terminal scrollback access.
      rl._writeToOutput = () => {};
    }
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

const main = async () => {
  const args = parseArgs(process.argv.slice(2));

  const email = (args.email || (await ask("Admin email: "))).trim().toLowerCase();
  const name = args.name || (await ask("Admin name: ")) || "Kormopulse Admin";
  let password = args.password;
  if (!password) {
    password = await ask("Admin password (min 6 chars, input not hidden — do not use your real password): ");
  }

  if (!email || !email.includes("@")) throw new Error("A valid --email is required");
  if (!password || password.length < 6) throw new Error("--password must be at least 6 characters");

  await connectDB();

  let user = await User.findOne({ email });
  if (user) {
    if (user.role === "admin") {
      console.log(`"${email}" is already an admin (id: ${user._id}).`);
    } else {
      user.role = "admin";
      user.emailVerified = true;
      user.isSuspended = false;
      await user.save({ validateBeforeSave: false });
      console.log(`Promoted existing user "${email}" to admin.`);
    }
  } else {
    user = await User.create({
      name,
      email,
      username: email.split("@")[0].toLowerCase(),
      password,
      role: "admin",
      emailVerified: true,
    });
    console.log(`Created admin "${email}" (id: ${user._id}).`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

main().catch((error) => {
  console.error("Failed to create admin:", error.message);
  process.exit(1);
});
