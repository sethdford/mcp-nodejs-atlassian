import winston from 'winston';
export class Logger {
    context;
    static globalLevel = 'info';
    logger;
    constructor(context) {
        this.context = context;
        this.logger = winston.createLogger({
            level: Logger.globalLevel,
            format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;
                return stack ? `${prefix} ${message}\n${stack} ${metaStr}` : `${prefix} ${message} ${metaStr}`;
            })),
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
                })
            ]
        });
    }
    static setLevel(level) {
        Logger.globalLevel = level;
    }
    debug(message, ...meta) {
        this.logger.debug(message, ...meta);
    }
    info(message, ...meta) {
        this.logger.info(message, ...meta);
    }
    warn(message, ...meta) {
        this.logger.warn(message, ...meta);
    }
    error(message, ...meta) {
        this.logger.error(message, ...meta);
    }
}
//# sourceMappingURL=logger.js.map