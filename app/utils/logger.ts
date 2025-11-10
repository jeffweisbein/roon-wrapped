// Simple logger for frontend
export function log(
  level: "error" | "warn" | "info" | "debug",
  message: string,
  metadata: Record<string, any> = {},
) {
  const timestamp = new Date().toISOString();
  const logMessage = {
    timestamp,
    level,
    message,
    ...metadata,
  };

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    switch (level) {
      case "error":
        console.error(logMessage);
        break;
      case "warn":
        console.warn(logMessage);
        break;
      case "info":
        console.info(logMessage);
        break;
      case "debug":
        console.debug(logMessage);
        break;
    }
  }

  // In production, you might want to send logs to a service
  // For now, we'll just use console.log
  console.log(JSON.stringify(logMessage));
}

export default { log };
