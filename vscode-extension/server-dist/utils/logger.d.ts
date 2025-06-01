export declare class Logger {
    private context;
    private static globalLevel;
    private logger;
    constructor(context: string);
    static setLevel(level: string): void;
    debug(message: string, ...meta: any[]): void;
    info(message: string, ...meta: any[]): void;
    warn(message: string, ...meta: any[]): void;
    error(message: string, ...meta: any[]): void;
}
//# sourceMappingURL=logger.d.ts.map