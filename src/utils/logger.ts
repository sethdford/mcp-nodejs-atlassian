import winston from 'winston';

export class Logger {
  private static globalLevel: string = 'info';
  private logger: winston.Logger;

  constructor(private context: string) {
    this.logger = winston.createLogger({
      level: Logger.globalLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
          const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
          const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;
          return stack ? `${prefix} ${message}\n${stack} ${metaStr}` : `${prefix} ${message} ${metaStr}`;
        })
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  static setLevel(level: string): void {
    Logger.globalLevel = level;
  }

  debug(message: string, ...meta: any[]): void {
    this.logger.debug(message, ...meta);
  }

  info(message: string, ...meta: any[]): void {
    this.logger.info(message, ...meta);
  }

  warn(message: string, ...meta: any[]): void {
    this.logger.warn(message, ...meta);
  }

  error(message: string, ...meta: any[]): void {
    this.logger.error(message, ...meta);
  }
} 