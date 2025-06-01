export declare class JiraClient {
    private client;
    private logger;
    private baseUrl;
    constructor();
    searchIssues(jql: string, fields?: string[], maxResults?: number): Promise<any>;
    getIssue(issueKey: string, fields?: string[], expand?: string[]): Promise<any>;
    createIssue(projectKey: string, issueType: string, summary: string, description?: string, priority?: string): Promise<any>;
    updateIssue(issueKey: string, fields: Record<string, any>): Promise<any>;
    addComment(issueKey: string, body: string): Promise<any>;
    getProjects(): Promise<any>;
}
//# sourceMappingURL=jira.d.ts.map