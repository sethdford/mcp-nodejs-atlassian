export declare class ConfluenceClient {
    private client;
    private logger;
    private baseUrl;
    constructor();
    search(query: string, spaceKey?: string, limit?: number): Promise<any>;
    getPage(pageId: string, expand?: string): Promise<any>;
    createPage(spaceKey: string, title: string, content: string, parentId?: string): Promise<any>;
    updatePage(pageId: string, title: string, content: string, version: number): Promise<any>;
    getSpaces(limit?: number, start?: number): Promise<any>;
}
//# sourceMappingURL=confluence.d.ts.map