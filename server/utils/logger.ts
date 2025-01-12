import path from 'path';
import winston from 'winston';

import config from '../config';

// Ensure logs directory exists
const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

// Custom format for log messages
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
    }
    
    return msg;
});

// Create logger instance
const logger = createLogger({
    level: config.server.logLevel,
    format: combine(
        timestamp(),
        logFormat
    ),
    transports: [
        // Console transport with colors
        new transports.Console({
            format: combine(
                colorize(),
                timestamp(),
                logFormat
            )
        }),
        // File transport for all logs
        new transports.File({
            filename: path.join(config.server.logDir, 'app.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),
        // Separate file for errors
        new transports.File({
            filename: path.join(config.server.logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        })
    ]
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
    new transports.File({
        filename: path.join(config.server.logDir, 'exceptions.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        tailable: true
    })
);

process.on('unhandledRejection', (error: Error) => {
    logger.error('Unhandled rejection:', error);
});

// Export a wrapper function for consistent logging
export function log(
    level: 'error' | 'warn' | 'info' | 'debug',
    message: string,
    metadata: Record<string, any> = {}
) {
    logger.log(level, message, metadata);
}

export default logger; 