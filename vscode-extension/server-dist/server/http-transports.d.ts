import { Server } from '@modelcontextprotocol/sdk/server/index.js';
export interface HttpTransportOptions {
    host: string;
    port: number;
    path?: string;
}
export declare class SSETransport {
    private options;
    private server;
    private logger;
    constructor(options: HttpTransportOptions);
    start(mcpServer: Server): Promise<void>;
    private handleRequest;
    close(): Promise<void>;
}
export declare class StreamableHttpTransport {
    private options;
    private server;
    private logger;
    constructor(options: HttpTransportOptions);
    start(mcpServer: Server): Promise<void>;
    private handleRequest;
    close(): Promise<void>;
}
//# sourceMappingURL=http-transports.d.ts.map