const { z } = require("zod");

// Define the environment schema
const envSchema = z.object({
  // Roon Configuration
  ROON_EXTENSION_ID: z.string().default("com.roonwrapped"),
  ROON_DISPLAY_NAME: z.string().default("Roon Wrapped"),
  ROON_DISPLAY_VERSION: z.string().default("1.0.0"),
  ROON_PUBLISHER: z.string().default("cackles"),
  ROON_EMAIL: z.string().email().default("jeff@hypelab.digital"),
  ROON_WEBSITE: z
    .string()
    .url()
    .default("https://github.com/jeffweisbein/roon-wrapped"),
  ROON_RECONNECT_TIMEOUT: z.string().transform(Number).default("30000"),
  ROON_MAX_RECONNECT_ATTEMPTS: z.string().transform(Number).default("10"),
  ROON_HEALTH_CHECK_INTERVAL: z.string().transform(Number).default("60000"),

  // Server Configuration
  SERVER_PORT: z.string().transform(Number).default("3003"),
  ROON_SERVER_PORT: z.string().transform(Number).optional(), // Legacy support
  SERVER_HOST: z.string().default("localhost"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_DIR: z.string().default("logs"),

  // Music Metadata APIs
  LASTFM_API_KEY: z.string().optional(),

  // Node environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

// Validate and parse environment variables
function validateEnv() {
  try {
    const env = envSchema.parse(process.env);

    // Log validation success
    console.log("[Env] Environment variables validated successfully");

    // Warn if Last.fm API key is not configured
    if (!env.LASTFM_API_KEY) {
      console.warn(
        "[Env] LASTFM_API_KEY not configured - recommendation features will be limited",
      );
      console.warn(
        "[Env] Get a free API key from https://www.last.fm/api/account/create",
      );
    }

    return env;
  } catch (error) {
    console.error("[Env] Environment validation failed:");
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

// Export validated environment variables
module.exports = {
  env: validateEnv(),
  validateEnv,
};
