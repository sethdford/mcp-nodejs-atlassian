# Contributing to MCP Atlassian

Thank you for your interest in contributing to MCP Atlassian! This document provides guidelines and instructions for contributing to this project.

## Development Setup

1. Make sure you have Node.js 18+ installed
2. Fork the repository
3. Clone your fork: `git clone https://github.com/YOUR-USERNAME/mcp-nodejs-atlassian.git`
4. Add the upstream remote: `git remote add upstream https://github.com/sooperset/mcp-nodejs-atlassian.git`
5. Install dependencies:
```bash
npm install
```
6. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your test credentials
```
7. Build the project:
```bash
npm run build
```

## Development Workflow

1. Create a feature or fix branch:
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

2. Make your changes

3. Run development mode for testing:
```bash
npm run dev
```

4. Ensure tests pass:
```bash
npm test
```

5. Run linting and fix issues:
```bash
npm run lint
npm run lint:fix
```

6. Build and test the final version:
```bash
npm run build
npm start -- --help
```

7. Commit your changes with clear, concise commit messages

8. Submit a pull request to the main branch

## Code Style

- TypeScript with strict type checking
- ESLint for code quality and consistency  
- Use proper type annotations
- Add JSDoc comments for public functions:

```typescript
/**
 * Searches Confluence content using CQL
 * @param query - The CQL search query
 * @param limit - Maximum number of results to return
 * @returns Promise resolving to search results
 */
async function searchContent(query: string, limit?: number): Promise<SearchResult[]> {
    // Implementation
}
```

## Testing

- Add tests for new functionality
- Ensure all existing tests pass
- Test OAuth setup wizard manually
- Test with different transport modes (stdio, SSE, HTTP)

## Pull Request Process

1. Fill out the PR template with a description of your changes
2. Ensure all CI checks pass
3. Test OAuth setup wizard if authentication changes are made
4. Request review from maintainers
5. Address review feedback if requested

## Release Process

Releases follow semantic versioning:
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions  
- **PATCH** version for backwards-compatible bug fixes

---

Thank you for contributing to MCP Atlassian!
