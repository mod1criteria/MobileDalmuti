import * as fs from 'fs';
import * as path from 'path';
import { format, createLogger, transports, Logger } from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');

export interface LoggerPaths {
  baseDir: string;
  backupDir: string;
  currentFile: string;
}

export function ensureLogDirs(): LoggerPaths {
  const baseDir = path.resolve(process.cwd(), 'logs');
  const backupDir = path.join(baseDir, 'backup');
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  return { baseDir, backupDir, currentFile: path.join(baseDir, 'server.log') };
}

export function createWinstonLogger(): Logger {
  const { baseDir, backupDir, currentFile } = ensureLogDirs();
  const level = process.env.LOG_LEVEL || 'info';
  const isProd = process.env.NODE_ENV === 'production';
  const colorizeConsole = !isProd && !!process.stdout.isTTY;

  const commonFormats = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    // Strip any ANSI colors so files stay clean
    format.uncolorize(),
    format.errors({ stack: true }),
    format.printf((info) => {
      const ctx = info.context ? `[${info.context}] ` : '';
      const msg = info.stack ? `${info.message}\n${info.stack}` : info.message;
      return `${info.timestamp} [${info.level.toUpperCase()}] ${ctx}${msg}`;
    }),
  );

  const logger = createLogger({
    level,
    format: commonFormats,
    defaultMeta: {},
    transports: [
      // Current run log file
      new transports.File({ filename: currentFile, level }),
      // Daily rotated backups into logs/backup/server-YYYY-MM-DD.log.gz
      new DailyRotateFile({
        dirname: backupDir,
        filename: 'server-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxFiles: process.env.LOG_MAX_FILES || '14d',
        level,
      }),
      // Pretty console in dev
      new transports.Console({
        level,
        format: !colorizeConsole
          ? commonFormats
          : format.combine(
              format.colorize(),
              format.timestamp({ format: 'HH:mm:ss' }),
              format.printf((info) => {
                const ctx = info.context ? `[${info.context}] ` : '';
                const msg = info.stack ? `${info.message}\n${info.stack}` : info.message;
                return `${info.timestamp} ${info.level}: ${ctx}${msg}`;
              }),
            ),
      }),
    ],
  });

  return logger;
}
