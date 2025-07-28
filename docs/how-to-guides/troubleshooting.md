# How to Troubleshoot Connection Issues

This guide helps you diagnose and fix common problems with the BambooHR MCP server.

## Quick Diagnosis

### 1. Check Server Status

**Test if the server starts:**
```bash
cd mcp-server
node dist/bamboo-mcp.js
```

**Expected output:**
```
 BambooHR MCP Server started successfully
 Environment variables configured correctly
 API connection test successful
```

### 2. Check Claude Integration

**In Claude Desktop, look for:**
- 🔌 **Green "bamboo"** indicator (server connected)
-  **Red "bamboo"** indicator (server error)
- ❓ **No indicator** (server not configured)

## Common Problems and Solutions

### Problem: "Environment variable not found"

**Symptoms:**
```
 Missing required environment variable: BAMBOO_API_KEY
 Missing required environment variable: BAMBOO_SUBDOMAIN
```

**Solution:**
```bash
# Check if variables are set
echo $BAMBOO_API_KEY
echo $BAMBOO_SUBDOMAIN

# If empty, add to your shell profile
nano ~/.zshrc

# Add these lines
export BAMBOO_API_KEY="your_api_key_here"
export BAMBOO_SUBDOMAIN="your_company_subdomain"

# Reload your shell
source ~/.zshrc
```

**Still not working?** See [Environment Setup Guide](environment-setup.md).

---

### Problem: "Invalid BambooHR API credentials"

**Symptoms:**
```
 Authentication failed: HTTP 401 Unauthorized
 Invalid BambooHR API credentials
```

**Solutions:**

**1. Verify API Key:**
```bash
# Test your API key directly
curl -u "YOUR_API_KEY:x" \
  "https://api.bamboohr.com/api/gateway.php/YOUR_SUBDOMAIN/v1/meta/fields/"
```

**2. Check Subdomain:**
- Your URL: `https://mycompany.bamboohr.com`
- Your subdomain: `mycompany` (not the full URL)

**3. Regenerate API Key:**
1. Log into BambooHR
2. Go to Settings → API Keys
3. Delete old key
4. Generate new key
5. Update environment variables

---

### Problem: "BambooHR API connection failed: HTTP 404"

**Symptoms:**
```
 BambooHR API connection failed: HTTP 404: Not Found
```

**Solution:**
This usually means the subdomain is incorrect.

```bash
# Check your subdomain
echo $BAMBOO_SUBDOMAIN

# Should be just the company name, not a URL
#  Correct: mycompany
#  Wrong: https://mycompany.bamboohr.com
#  Wrong: mycompany.bamboohr.com
```

---

### Problem: "Rate limit exceeded"

**Symptoms:**
```
⏱ Rate limit exceeded. Please wait before making more requests.
 HTTP 429: Too Many Requests
```

**Solution:**
```bash
# Wait a few minutes, then test again
sleep 300  # Wait 5 minutes
node dist/bamboo-mcp.js
```

**Prevention:**
- Avoid rapid repeated queries
- Use caching when possible
- Implement request spacing

---

### Problem: "Server not found in Claude"

**Symptoms:**
- No bamboo indicator in Claude
- "Tool not available" messages
- Server not listed in Claude settings

**Solutions:**

**1. Check Configuration File:**
```bash
# Check if config exists
cat "~/Library/Application Support/Claude/claude_desktop_config.json"
```

**2. Verify Server Path:**
```json
{
  "mcpServers": {
    "bamboo": {
      "command": "node",
      "args": ["/full/path/to/mcp-server/dist/bamboo-mcp.js"],
      "env": {
        "BAMBOO_API_KEY": "your_api_key",
        "BAMBOO_SUBDOMAIN": "your_subdomain"
      }
    }
  }
}
```

**3. Restart Claude:**
- Quit Claude Desktop completely
- Wait 10 seconds
- Restart Claude Desktop

---

### Problem: "Permission denied" errors

**Symptoms:**
```
 Error: EACCES: permission denied
 Cannot read configuration file
```

**Solutions:**

**1. Fix File Permissions:**
```bash
# Make sure files are readable
chmod 644 ~/Library/Application\ Support/Claude/claude_desktop_config.json
chmod +x dist/bamboo-mcp.js
```

**2. Check Directory Permissions:**
```bash
# Ensure directory is accessible
ls -la ~/Library/Application\ Support/Claude/
```

---

### Problem: "Module not found" errors

**Symptoms:**
```
 Error: Cannot find module 'some-package'
 MODULE_NOT_FOUND
```

**Solution:**
```bash
# Rebuild the project
npm install
npm run build

# Or use the build script
./scripts/build.sh
```

---

### Problem: Server starts but tools don't work

**Symptoms:**
- Server shows "started successfully"
- Claude shows green indicator
- But queries return "Tool not available"

**Solutions:**

**1. Check Tool Registration:**
```bash
# Look for tool registration messages
node dist/bamboo-mcp.js | grep "Registered"
```

**2. Test Individual Tools:**
```bash
# Test discovery tool
echo '{"method": "tools/call", "params": {"name": "bamboo_discover_datasets"}}' | node dist/bamboo-mcp.js
```

**3. Check API Permissions:**
Your BambooHR user might not have access to the data you're requesting.

---

### Problem: "Connection timeout" errors

**Symptoms:**
```
 Connection timeout
 Request failed after 30000ms
```

**Solutions:**

**1. Check Network:**
```bash
# Test BambooHR connectivity
ping api.bamboohr.com
```

**2. Test Direct API Access:**
```bash
curl -u "YOUR_API_KEY:x" \
  --connect-timeout 10 \
  "https://api.bamboohr.com/api/gateway.php/YOUR_SUBDOMAIN/v1/meta/fields/"
```

**3. Check Firewall/Proxy:**
- Ensure port 443 (HTTPS) is open
- Check corporate firewall settings
- Verify proxy configuration

## Advanced Troubleshooting

### Enable Debug Logging

```bash
# Enable detailed logging
export AUDIT_LOGGING="true"
export NODE_ENV="development"

# Run with debug output
node dist/bamboo-mcp.js
```

### Test API Endpoints Manually

```bash
# Test fields endpoint
curl -u "YOUR_API_KEY:x" \
  "https://api.bamboohr.com/api/gateway.php/YOUR_SUBDOMAIN/v1/meta/fields/" \
  | jq .

# Test employee directory
curl -u "YOUR_API_KEY:x" \
  "https://api.bamboohr.com/api/gateway.php/YOUR_SUBDOMAIN/v1/employees/directory" \
  | jq .
```

### Check Claude Logs

**macOS Claude Desktop logs:**
```bash
# View Claude logs
tail -f ~/Library/Logs/Claude/claude.log

# Or check crash reports
ls ~/Library/Application\ Support/Claude/CrashReports/
```

### Validate Configuration

```bash
# Manually validate environment
node -e "
console.log('API Key:', process.env.BAMBOO_API_KEY ? 'Set' : 'Missing');
console.log('Subdomain:', process.env.BAMBOO_SUBDOMAIN || 'Missing');
"
```

## Performance Issues

### Problem: Slow responses

**Diagnosis:**
```bash
# Test response times
time curl -u "YOUR_API_KEY:x" \
  "https://api.bamboohr.com/api/gateway.php/YOUR_SUBDOMAIN/v1/employees/directory"
```

**Solutions:**
- Enable caching (set `CACHE_ENABLED=true`)
- Limit field requests
- Use pagination for large datasets

### Problem: Memory usage

**Monitor memory:**
```bash
# Check memory usage
node --max-old-space-size=512 dist/bamboo-mcp.js
```

## Getting Help

### Collect Diagnostic Information

Before asking for help, collect:

```bash
# System information
node --version
npm --version
echo $SHELL

# Configuration
echo "API Key: $(echo $BAMBOO_API_KEY | cut -c1-4)..."
echo "Subdomain: $BAMBOO_SUBDOMAIN"

# Test results
node dist/bamboo-mcp.js 2>&1 | head -20
```

### Common Solutions Checklist

- [ ] Environment variables are set correctly
- [ ] API key is valid and not expired
- [ ] Subdomain matches your BambooHR URL
- [ ] Network connectivity to api.bamboohr.com
- [ ] Claude Desktop configuration is correct
- [ ] Server builds and starts successfully
- [ ] File permissions are correct
- [ ] Claude Desktop has been restarted

### When to Contact Support

Contact support if:
-  All checklist items pass
-  Basic connectivity works
-  Specific functionality fails
-  Error messages are unclear

## See Also

- [Environment Setup Guide](environment-setup.md)
- [Build and Deploy Guide](build-and-deploy.md)
- [Configuration Reference](../reference/configuration.md)
- [API Reference](../reference/api.md) 