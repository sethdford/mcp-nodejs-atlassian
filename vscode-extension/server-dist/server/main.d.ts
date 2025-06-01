interface ConnectionOptions {
    type: 'stdio' | 'sse' | 'streamable-http';
    host?: string;
    port?: number;
    path?: string;
}
export declare function createAtlassianMCPServer(): {
    connect: (options: ConnectionOptions) => Promise<void>;
    oninitialized?: () => void;
    onclose?: () => void;
    onerror?: (error: Error) => void;
    fallbackRequestHandler?: ((request: import("@modelcontextprotocol/sdk/types.js").Request) => Promise<{
        [x: string]: unknown;
        _meta?: {
            [x: string]: unknown;
        } | undefined;
    } | import("@modelcontextprotocol/sdk/types.js").ServerResult>) | undefined;
    fallbackNotificationHandler?: (notification: import("@modelcontextprotocol/sdk/types.js").Notification) => Promise<void>;
};
export {};
//# sourceMappingURL=main.d.ts.map