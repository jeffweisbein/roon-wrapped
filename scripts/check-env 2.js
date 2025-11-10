#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const REQUIRED_VARS = [
  "ROON_CORE_HOST",
  "ROON_CORE_PORT",
  "NEXT_PUBLIC_APP_URL",
];

function checkEnvFile() {
  const envPath = path.join(process.cwd(), ".env");
  const envExamplePath = path.join(process.cwd(), ".env.example");

  // Check if .env exists
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      console.log("⚠️  No .env file found. Copying from .env.example...");
      fs.copyFileSync(envExamplePath, envPath);
    } else {
      console.error("❌ No .env or .env.example file found!");
      process.exit(1);
    }
  }

  // Read and parse .env file
  const envContent = fs.readFileSync(envPath, "utf8");
  const envVars = Object.fromEntries(
    envContent
      .split("\n")
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split("=")),
  );

  // Check required variables
  const missingVars = REQUIRED_VARS.filter((varName) => !envVars[varName]);

  if (missingVars.length > 0) {
    console.error("❌ Missing required environment variables:");
    missingVars.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    process.exit(1);
  }

  console.log("✅ Environment variables validated successfully!");
}

checkEnvFile();
