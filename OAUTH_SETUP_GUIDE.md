# OAuth Setup Guide for Atlassian MCP VS Code Extension

## Overview

The Atlassian MCP VS Code extension now includes a fully functional OAuth setup wizard that helps you authenticate with Atlassian Cloud services. This guide explains how to use the OAuth setup functionality.

## How to Access OAuth Setup

There are several ways to access the OAuth setup wizard:

### Method 1: Via Extension Configuration
1. Open the Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
2. Search for "Atlassian MCP: Configure" and select it
3. Click the "🚀 OAuth Setup Wizard" button in the configuration panel

### Method 2: Via Command Palette
1. Open the Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
2. Search for "Atlassian MCP: OAuth Setup Wizard" and select it

### Method 3: Via Extension Panel
1. Open the Explorer panel in VS Code
2. Find the "Atlassian MCP" section
3. Click "OAuth Setup Wizard" in the welcome view

## OAuth Setup Process

When you run the OAuth setup wizard, you'll be presented with two options:

### Web-based Setup (Recommended)
This is the preferred method as it runs entirely within VS Code:

1. **Choose "Web-based setup (Recommended)"**
2. **Enter OAuth Credentials:**
   - Client ID: Your Atlassian OAuth app client ID
   - Client Secret: Your Atlassian OAuth app client secret
   - Scopes: Default scopes are provided (you can modify if needed)

3. **Browser Authorization:**
   - A local callback server starts on `localhost:8080`
   - Your default browser opens to the Atlassian authorization page
   - Log in and authorize the application

4. **Automatic Configuration:**
   - The extension automatically exchanges the authorization code for tokens
   - Auto-detects your Atlassian Cloud ID
   - Displays all configuration variables you need

### Terminal-based Setup (Fallback)
This method uses the bundled server CLI tool:

1. **Choose "Terminal-based setup"**
2. **Interactive Terminal:**
   - A VS Code terminal opens with the OAuth setup wizard
   - Follow the prompts to enter your OAuth credentials
   - Complete the browser authorization flow

## Setting Up Your Atlassian OAuth App

Before using the OAuth setup wizard, you need to create an OAuth app in the Atlassian Developer Console:

1. **Go to [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)**
2. **Create a new app:**
   - Click "Create" → "OAuth 2.0 integration"
   - Give your app a name (e.g., "VS Code MCP Integration")

3. **Configure your app:**
   - **Callback URL:** `http://localhost:8080/callback`
   - **Scopes:** Select the following scopes:
     - `read:jira-work` - Read Jira issues
     - `write:jira-work` - Create/update Jira issues  
     - `read:confluence-content.all` - Read Confluence content
     - `write:confluence-content` - Create/update Confluence content
     - `offline_access` - Refresh tokens

4. **Get your credentials:**
   - Copy the Client ID and Client Secret
   - These will be used in the OAuth setup wizard

## After OAuth Setup

Once the OAuth setup is complete, you'll see output like this:

```
🎉 OAuth setup completed successfully!

Add these environment variables to your .env file:
ATLASSIAN_OAUTH_CLIENT_ID=your-client-id
ATLASSIAN_OAUTH_CLIENT_SECRET=your-client-secret
ATLASSIAN_OAUTH_CLOUD_ID=your-cloud-id
ATLASSIAN_OAUTH_ACCESS_TOKEN=your-access-token
ATLASSIAN_OAUTH_REFRESH_TOKEN=your-refresh-token

Your Atlassian URLs for configuration:
JIRA_URL=https://api.atlassian.com/ex/jira/your-cloud-id
CONFLUENCE_URL=https://api.atlassian.com/ex/confluence/your-cloud-id/wiki
```

## VS Code Settings

You can also configure the extension through VS Code settings:

1. Open Settings (`Cmd+,` on Mac, `Ctrl+,` on Windows/Linux)
2. Search for "Atlassian MCP"
3. Configure:
   - Jira URL
   - Confluence URL
   - Authentication method (set to "oauth")
   - Auto-start server option

## Troubleshooting

### Port 8080 in Use
If you get an error that port 8080 is in use:
- Close other applications using that port
- Or use the terminal-based setup method

### Browser Doesn't Open
If the browser doesn't open automatically:
- Check the VS Code output panel for the authorization URL
- Manually copy and paste the URL into your browser

### OAuth Errors
If you encounter OAuth errors:
- Verify your Client ID and Client Secret are correct
- Ensure your OAuth app has the correct callback URL
- Check that all required scopes are granted

### Extension Not Working
If the extension setup doesn't work:
- Check the VS Code output panel for detailed error messages
- Try reloading VS Code (`Cmd+R` on Mac, `Ctrl+R` on Windows/Linux)
- Ensure you have the latest version of the extension

## Security Notes

- OAuth tokens are sensitive - keep them secure
- Don't commit OAuth credentials to version control
- Use environment variables or VS Code's secure storage
- Tokens can be revoked in your Atlassian account if needed

## Support

If you encounter issues:
1. Check the VS Code output panel (View → Output → "Atlassian MCP Server")
2. Enable verbose logging in extension settings
3. File an issue on the project GitHub repository with logs 