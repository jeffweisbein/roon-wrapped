import fs from 'fs';
import path from 'path';

interface Config {
  roon: {
    extension_id: string;
    display_name: string;
    display_version: string;
    publisher: string;
    email: string;
    website: string;
  };
  server: {
    port: number;
    host: string;
    cors: {
      origin: string[];
      methods: string[];
    };
  };
  history: {
    dataPath: string;
    backupPath: string;
    backupInterval: number;
  };
  logging: {
    level: string;
    dir: string;
    maxSize: string;
    maxFiles: number;
  };
}

function loadConfig(): Config {
  const env = process.env.NODE_ENV || 'development';
  const configPath = path.join(process.cwd(), 'config', `${env}.json`);
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found for environment: ${env}`);
  }

  const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  return {
    roon: {
      extension_id: process.env.ROON_EXTENSION_ID || fileConfig.roon.extension_id,
      display_name: process.env.ROON_DISPLAY_NAME || fileConfig.roon.display_name,
      display_version: process.env.ROON_DISPLAY_VERSION || fileConfig.roon.display_version,
      publisher: process.env.ROON_PUBLISHER || fileConfig.roon.publisher,
      email: process.env.ROON_EMAIL || fileConfig.roon.email,
      website: process.env.ROON_WEBSITE || fileConfig.roon.website,
    },
    server: {
      port: parseInt(process.env.PORT || fileConfig.server.port),
      host: process.env.HOST || fileConfig.server.host,
      cors: {
        origin: process.env.CORS_ORIGIN ? 
          process.env.CORS_ORIGIN.split(',') : 
          fileConfig.server.cors.origin,
        methods: process.env.CORS_METHODS ? 
          process.env.CORS_METHODS.split(',') : 
          fileConfig.server.cors.methods,
      },
    },
    history: {
      dataPath: process.env.HISTORY_DATA_PATH || fileConfig.history.dataPath,
      backupPath: process.env.HISTORY_BACKUP_PATH || fileConfig.history.backupPath,
      backupInterval: parseInt(process.env.HISTORY_BACKUP_INTERVAL || fileConfig.history.backupInterval),
    },
    logging: {
      level: process.env.LOG_LEVEL || fileConfig.logging.level,
      dir: process.env.LOG_DIR || fileConfig.logging.dir,
      maxSize: process.env.LOG_MAX_SIZE || fileConfig.logging.maxSize,
      maxFiles: parseInt(process.env.LOG_MAX_FILES || fileConfig.logging.maxFiles),
    },
  };
}

const config = loadConfig();
export default config; 