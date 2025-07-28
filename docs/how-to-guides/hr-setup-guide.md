# BambooHR MCP Setup Guide for HR Professionals

> **IMPORTANT**: This is an **unofficial**, community-driven open source tool. It is NOT affiliated with, endorsed by, or connected to BambooHR LLC. BambooHR® is a registered trademark of BambooHR LLC.

This guide helps HR professionals connect BambooHR to Claude Desktop in the simplest way possible using the publicly available BambooHR API.

##  What You'll Achieve

After following this guide, you'll be able to ask Claude Desktop questions like:
- "Who is out on leave this week?"
- "Find John Smith's contact information"
- "Show me the engineering team roster"
- "What are the pending time-off requests?"

##  Prerequisites

Before starting, make sure you have:

1. **Claude Desktop installed** - Download from [claude.ai/download](https://claude.ai/download)
2. **BambooHR admin access** - You need permission to create API keys
3. **Node.js installed** - Download from [nodejs.org](https://nodejs.org)

##  Three Setup Methods (Choose One)

### Method 1: Setup Wizard (Recommended for Most Users)

**Easiest option - Wizard guides you through everything**

1. **Download or clone this repository**
2. **Open Terminal/Command Prompt** and navigate to the folder
3. **Run the setup wizard:**
   ```bash
   ./scripts/validate-setup.sh
   ```
4. **Follow the prompts** - the wizard will:
   - Test your system
   - Ask for your BambooHR credentials
   - Configure Claude Desktop automatically
   - Verify everything works

### Method 2: Manual Configuration Template

**For users comfortable with editing files**

1. **Get your BambooHR credentials** (see section below)
2. **Find your Claude Desktop config file:**
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux:** `~/.config/claude/claude_desktop_config.json`
3. **Copy the template** from `claude_desktop_config_template.json`
4. **Replace the placeholders** with your actual values
5. **Save the file** and restart Claude Desktop

### Method 3: Copy-Paste Configuration

**For users who prefer detailed instructions**

1. **Build the server** first:
   ```bash
   ./scripts/build.sh
   ```

2. **Get the full path** to the built server:
   ```bash
   pwd
   ```
   This will show something like `/Users/yourname/mcp-server`
   The server path is: `/Users/yourname/mcp-server/dist/bamboo-mcp.js`

3. **Open Claude Desktop config file** in a text editor
4. **Add this configuration** (replace the REPLACE_WITH values):

```json
{
  "mcpServers": {
    "bamboohr": {
      "command": "node",
      "args": [
        "/Users/yourname/mcp-server/dist/bamboo-mcp.js"
      ],
      "env": {
        "BAMBOO_API_KEY": "your_actual_api_key_here",
        "BAMBOO_SUBDOMAIN": "your_company_name_here"
      }
    }
  }
}
```

##  Getting BambooHR Credentials

You need two pieces of information:

### 1. API Key

1. **Log into BambooHR** with your admin account
2. **Click your name** in the bottom-left corner of any page
3. **Select "API Keys"** from the menu
4. **Click "Add New Key"**
5. **Name it** "Claude Desktop" (or similar)
6. **Copy the generated key** - it looks like: `abc123def456ghi789jkl012mno345pqr678stu901`

### 2. Company Subdomain

This is the company name part of your BambooHR URL:

- If your BambooHR URL is: `https://mycompany.bamboohr.com`
- Then your subdomain is: `mycompany`

**Examples:**
- `acmecorp.bamboohr.com` → subdomain is `acmecorp`
- `techstartup.bamboohr.com` → subdomain is `techstartup`

##  Testing Your Setup

After configuration:

1. **Restart Claude Desktop** completely
2. **Open a new conversation**
3. **Ask Claude:** "What BambooHR tools do you have available?"
4. **Try a test query:** "Who is out on leave today?"

If you see BambooHR data, congratulations! 

##  Available BambooHR Commands

Once configured, you can ask Claude to:

### Employee Information
- "Find employee John Smith"
- "Look up sarah.jones@company.com"
- "Show me employee ID 12345"

### Time Off & Leave
- "Who is out on leave today?"
- "Show me who's out this week"
- "What are the pending time-off requests?"

### Team & Department Data
- "Show me the engineering team roster"
- "List everyone in the marketing department"
- "Get contact info for the sales team"

### Analytics & Reports
- "Run workforce analytics for the engineering department"
- "Show me available custom reports"
- "What datasets are available for analysis?"

##  Troubleshooting

### "Server not found" or "Connection failed"

1. **Check the file path** - Make sure the path to `bamboo-mcp.js` is correct
2. **Verify Node.js** - Run `node --version` in terminal
3. **Rebuild the server** - Run `./scripts/build.sh`

### "Authentication failed" or "API error"

1. **Double-check your API key** - Make sure it's copied correctly
2. **Verify subdomain** - Ensure it matches your BambooHR URL
3. **Check permissions** - Ensure your BambooHR account has API access

### "No response" or "Tools not available"

1. **Restart Claude Desktop** completely
2. **Check config file syntax** - Ensure JSON is valid (use a JSON validator)
3. **Review logs** - Check Claude Desktop logs for errors

### Still Having Issues?

1. **Run the validation script:**
   ```bash
   ./scripts/validate-setup.sh
   ```

2. **Check the logs** - Look in Claude Desktop's log files for specific error messages

3. **Try the setup wizard** - It catches and explains most common issues

## Security Notes

- **API keys are sensitive** - Don't share them or store them in public places
- **The config file** contains your credentials - keep it secure
- **Use least-privilege principle** - Create API keys specifically for Claude Desktop
- **Regularly rotate keys** - Consider updating API keys periodically

## Getting Help

If you're still having trouble:

1. **Check our troubleshooting guide** in `docs/troubleshooting.md`
2. **Run the validation script** to identify specific issues
3. **Contact your IT team** if you need help with Node.js installation
4. **Review BambooHR documentation** for API key management

---

**That's it!** You should now have BambooHR connected to Claude Desktop. Enjoy having your HR data at your fingertips! 