# How to Set Up Environment Variables

This guide shows you how to properly configure environment variables for the BambooHR MCP server across different operating systems and shells.

## Problem: Setting Environment Variables

You need to configure `BAMBOO_API_KEY` and `BAMBOO_SUBDOMAIN` so the MCP server can connect to your BambooHR account.

## Quick Solution

**For most users (macOS with zsh):**
```bash
# Edit your shell profile
nano ~/.zshrc

# Add these lines
export BAMBOO_API_KEY="your_api_key_here"
export BAMBOO_SUBDOMAIN="your_company_subdomain"

# Reload
source ~/.zshrc
```

## Detailed Solutions by Operating System

### macOS

#### Using zsh (default on macOS Catalina+)
```bash
# Open your zsh profile
open ~/.zshrc

# Add environment variables
export BAMBOO_API_KEY="your_bamboo_api_key"
export BAMBOO_SUBDOMAIN="your_company_subdomain"
export AUDIT_LOGGING="true"  # Optional: enable detailed logging

# Apply changes
source ~/.zshrc
```

#### Using bash (older macOS or manually switched)
```bash
# Edit bash profile
nano ~/.bash_profile

# Add the same export statements
export BAMBOO_API_KEY="your_bamboo_api_key"
export BAMBOO_SUBDOMAIN="your_company_subdomain"

# Apply changes
source ~/.bash_profile
```

### Linux

#### Ubuntu/Debian (bash)
```bash
# Edit bashrc
nano ~/.bashrc

# Add environment variables
export BAMBOO_API_KEY="your_bamboo_api_key"
export BAMBOO_SUBDOMAIN="your_company_subdomain"

# Apply changes
source ~/.bashrc
```

#### Other Linux distributions
```bash
# Check your shell
echo $SHELL

# Edit the appropriate file:
# - For bash: ~/.bashrc
# - For zsh: ~/.zshrc
# - For fish: ~/.config/fish/config.fish
```

### Windows

#### Using PowerShell
```powershell
# Set environment variables for current session
$env:BAMBOO_API_KEY = "your_bamboo_api_key"
$env:BAMBOO_SUBDOMAIN = "your_company_subdomain"

# Set permanently (requires admin)
[Environment]::SetEnvironmentVariable("BAMBOO_API_KEY", "your_bamboo_api_key", "User")
[Environment]::SetEnvironmentVariable("BAMBOO_SUBDOMAIN", "your_company_subdomain", "User")
```

#### Using Command Prompt
```cmd
# Set for current session
set BAMBOO_API_KEY=your_bamboo_api_key
set BAMBOO_SUBDOMAIN=your_company_subdomain

# Set permanently
setx BAMBOO_API_KEY "your_bamboo_api_key"
setx BAMBOO_SUBDOMAIN "your_company_subdomain"
```

## Advanced Configuration Options

### All Available Environment Variables

```bash
# Required
export BAMBOO_API_KEY="your_api_key"
export BAMBOO_SUBDOMAIN="your_subdomain"

# Optional
export AUDIT_LOGGING="true"              # Enable detailed logging
export SKIP_CONNECTION_TEST="false"      # Skip startup connection test
export NODE_ENV="production"             # Set environment mode
export MCP_SERVER_PORT="3000"           # Custom server port
```

### Development vs Production

**Development setup:**
```bash
export NODE_ENV="development"
export AUDIT_LOGGING="true"
export SKIP_CONNECTION_TEST="false"
```

**Production setup:**
```bash
export NODE_ENV="production"
export AUDIT_LOGGING="false"
export SKIP_CONNECTION_TEST="false"
```

## Troubleshooting Environment Issues

### Problem: "Environment variable not found"

**Check if variables are set:**
```bash
echo $BAMBOO_API_KEY
echo $BAMBOO_SUBDOMAIN
```

**Should show your values, not empty output.**

### Problem: Variables don't persist after restart

**Solution:** Make sure you added them to the correct profile file and sourced it.

```bash
# Check which shell you're using
echo $SHELL

# Common files to check:
ls -la ~/.zshrc ~/.bashrc ~/.bash_profile ~/.profile
```

### Problem: Variables work in terminal but not in applications

**macOS Solution:** Add to `~/.profile` (affects all applications):
```bash
# Edit profile
nano ~/.profile

# Add variables
export BAMBOO_API_KEY="your_api_key"
export BAMBOO_SUBDOMAIN="your_subdomain"

# Restart your computer or log out/in
```

### Problem: Special characters in API key

**Solution:** Use single quotes to prevent shell interpretation:
```bash
export BAMBOO_API_KEY='your-api-key-with-special&chars'
```

## Security Best Practices

### 1. Use Restricted File Permissions
```bash
# Make your profile file readable only by you
chmod 600 ~/.zshrc
```

### 2. Don't Commit Environment Files
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

### 3. Use Environment Files for Local Development
```bash
# Create .env file (don't commit this)
cat > .env << EOF
BAMBOO_API_KEY=your_api_key
BAMBOO_SUBDOMAIN=your_subdomain
EOF

# Load in your application
# (Note: MCP servers typically use system env vars)
```

## Verification Steps

### 1. Test Variable Access
```bash
# In terminal
node -e "console.log(process.env.BAMBOO_API_KEY)"
```

### 2. Test Environment Variables
```bash
# Check if variables are set
echo "API Key: ${BAMBOO_API_KEY:0:8}..."
echo "Subdomain: $BAMBOO_SUBDOMAIN"
```

### 3. Test Connection
```bash
# Start the server and check for success message
node dist/bamboo-mcp.js
```

**Expected output:**
```
 BambooHR MCP Server started successfully
 Environment variables configured correctly
```

## Using .env Files (Alternative Method)

Some users prefer `.env` files for local development:

```bash
# Create .env file in project root
cat > .env << EOF
BAMBOO_API_KEY=your_api_key
BAMBOO_SUBDOMAIN=your_subdomain
AUDIT_LOGGING=true
EOF

# Install dotenv (if using Node.js directly)
npm install dotenv

# Load in your application (custom setup)
# Note: Standard MCP servers use system environment variables
```

## Next Steps

- [How to Build and Deploy the Server](build-and-deploy.md)
- [How to Troubleshoot Connection Issues](troubleshooting.md)
- [Configuration Reference](../reference/configuration.md) 