# BambooHR Desktop Extension (.dxt) Guide

##  What is a Desktop Extension?

A Desktop Extension (.dxt) is a one-click installation package for Claude Desktop. Instead of manually editing configuration files, HR users can simply double-click the `.dxt` file to install BambooHR integration.

## 🏗 Building the Desktop Extension

### Prerequisites

1. **Node.js installed** - Download from [nodejs.org](https://nodejs.org)
2. **DXT toolchain** - Will be installed automatically by the build script

### Build Process

1. **Navigate to the project directory**
2. **Run the DXT build script:**
   ```bash
   ./scripts/build-dxt.sh
   ```
3. **The script will:**
   - Install DXT toolchain if needed
   - Build the MCP server
   - Package everything into `bamboohr-mcp.dxt`

##  What's Included in the DXT Package

The Desktop Extension includes:

- **MCP Server** - The compiled BambooHR MCP server
- **Dependencies** - All required Node.js packages
- **Manifest** - Configuration and metadata
- **Documentation** - Setup guide for users
- **Icon** - Visual identifier (placeholder for now)

## 👥 HR User Installation (The Simple Way)

### Step 1: Get the Extension File

Your IT team will provide you with `bamboohr-mcp.dxt`

### Step 2: Install in Claude Desktop

1. **Double-click** `bamboohr-mcp.dxt`
2. **Claude Desktop will open** and show the installation dialog
3. **Click "Install"** to add the BambooHR extension

### Step 3: Configure Your Credentials

Claude Desktop will ask for:

1. **BambooHR API Key**
   - Log into BambooHR
   - Click your name (bottom-left)
   - Select "API Keys"
   - Create new key named "Claude Desktop"
   - Copy and paste the key

2. **Company Subdomain**
   - From your BambooHR URL
   - If URL is `mycompany.bamboohr.com`
   - Enter `mycompany`

### Step 4: Start Using

That's it! You can now ask Claude:
- "What BambooHR tools are available?"
- "Who is out on leave today?"
- "Find employee John Smith"

##  Technical Details

### Manifest Configuration

The `.dxt` file uses this configuration:

```json
{
  "name": "bamboohr-mcp",
  "displayName": "BambooHR MCP Server",
  "type": "node",
  "entrypoint": "dist/bamboo-mcp.js",
  "configuration": {
    "required": [
      {
        "key": "api_key",
        "name": "BambooHR API Key",
        "type": "secret"
      },
      {
        "key": "subdomain", 
        "name": "Company Subdomain",
        "type": "string"
      }
    ]
  }
}
```

### Security Features

- **API keys stored securely** in OS keychain
- **No manual config file editing** required
- **Automatic dependency management**
- **One-click updates** when new versions are available

##  Distribution Options

### Internal Distribution

1. **Build the extension** using `./scripts/build-dxt.sh`
2. **Upload to company intranet** or shared drive
3. **Send installation instructions** to HR team
4. **Provide support** for credential setup

### Marketplace Distribution

1. **Publish to Claude Desktop Extension marketplace** (when available)
2. **Users can discover and install** from within Claude Desktop
3. **Automatic updates** handled by the platform

## 🆚 Comparison: DXT vs Manual Setup

| Feature | Desktop Extension (.dxt) | Manual Setup |
|---------|-------------------------|--------------|
| **Installation** | Double-click | Edit JSON files |
| **Dependencies** | Bundled | Manual npm install |
| **Configuration** | GUI dialog | Text editing |
| **Updates** | One-click | Manual rebuild |
| **User Skill Level** | Any HR user | Technical knowledge |
| **Security** | OS keychain | Plain text files |
| **Error Prone** | Very low | High |

##  Troubleshooting DXT Installation

### "Extension failed to install"

1. **Check Claude Desktop version** - Ensure you have latest version
2. **Verify file integrity** - Re-download the .dxt file
3. **Check permissions** - Ensure you can install software

### "Configuration dialog doesn't appear"

1. **Restart Claude Desktop** completely
2. **Try installing again**
3. **Check if extension is already installed**

### "BambooHR tools not working"

1. **Verify API key** - Test in BambooHR directly
2. **Check subdomain** - Ensure it matches your URL
3. **Restart Claude Desktop** after configuration

##  Updates and Maintenance

### Updating the Extension

1. **Users receive update notifications** in Claude Desktop
2. **Click "Update"** to install new version
3. **Credentials are preserved** automatically

### Building New Versions

1. **Update version** in `manifest.json`
2. **Run build script** `./scripts/build-dxt.sh`
3. **Distribute new .dxt file**

##  Best Practices

### For IT Teams

- **Test the extension** before distributing
- **Provide clear installation instructions**
- **Set up internal support** for credential issues
- **Consider creating custom icons** for branding

### For HR Users

- **Keep API keys secure** - don't share them
- **Report issues** to IT team promptly
- **Update extensions** when notified
- **Test functionality** after installation

##  Benefits for HR Teams

### Simplified Setup
- **No technical knowledge required**
- **Guided configuration process**
- **Error-resistant installation**

### Better Security
- **Credentials stored securely**
- **No config files to manage**
- **Automatic security updates**

### Improved Productivity
- **Instant access to HR data**
- **Natural language queries**
- **Integrated workflow**

---

The Desktop Extension approach transforms BambooHR MCP setup from a technical challenge into a simple, user-friendly experience that any HR professional can complete in minutes.