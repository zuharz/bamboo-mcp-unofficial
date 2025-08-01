# 🔧 BambooHR MCP Authentication Troubleshooting Guide

## ❌ **Issue Identified: 401 Unauthorized Errors**

Based on the Claude Desktop logs analysis, **all BambooHR tools are failing with 401 Unauthorized errors**. This indicates the API credentials are not properly configured in Claude Desktop.

## 📋 **Log Analysis Summary**

**From**: `/Users/sergejs/Library/Logs/Claude/mcp-server-BambooHR MCP Server (Unofficial).log`

```
2025-08-01T10:04:07.372Z ERROR: BambooHR API error: 401 Unauthorized
2025-08-01T10:05:03.032Z ERROR: Dataset discovery failed - BambooHR API error: 401 Unauthorized
2025-08-01T10:08:39.162Z ERROR: Who's out calendar failed - BambooHR API error: 401 Unauthorized
```

**Root Cause**: Environment variables `BAMBOO_API_KEY` and `BAMBOO_SUBDOMAIN` are not being passed to the MCP server.

## 🛠️ **Required Claude Desktop Configuration**

The BambooHR MCP server requires configuration in Claude Desktop. Here's what needs to be set up:

### **Step 1: Configure Claude Desktop**

Add the BambooHR MCP server configuration to your Claude Desktop settings:

```json
{
  "mcpServers": {
    "bamboohr-mcp": {
      "command": "node",
      "args": ["/path/to/your/bamboo-mcp-server/server/index.js"],
      "env": {
        "BAMBOO_API_KEY": "your_actual_api_key_here",
        "BAMBOO_SUBDOMAIN": "your_company_subdomain"
      }
    }
  }
}
```

### **Step 2: Get Your BambooHR Credentials**

#### **BambooHR API Key**:

1. Log into your BambooHR account
2. Go to **User Menu** → **API Keys**
3. Generate a new API key or copy existing one
4. Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`

#### **Company Subdomain**:

1. Look at your BambooHR URL
2. If your URL is `https://mycompany.bamboohr.com`
3. Your subdomain is: `mycompany`

### **Step 3: Restart Claude Desktop**

After adding the configuration:

1. **Quit Claude Desktop completely**
2. **Restart the application**
3. **Test the BambooHR tools**

## 🔍 **Verification Steps**

Once configured, test these tools in order:

1. **Basic Connection**: `bamboo_list_departments`
2. **Data Discovery**: `bamboo_discover_datasets`
3. **Employee Search**: `bamboo_find_employee` with a name
4. **Calendar Data**: `bamboo_whos_out`

## ⚠️ **Common Configuration Issues**

### **Issue 1: Wrong API Key Format**

- ❌ **Wrong**: API key with spaces or special characters
- ✅ **Correct**: Long alphanumeric string (usually 40 characters)

### **Issue 2: Incorrect Subdomain**

- ❌ **Wrong**: `https://mycompany.bamboohr.com` or `mycompany.bamboohr.com`
- ✅ **Correct**: Just `mycompany`

### **Issue 3: Missing Permissions**

- Ensure your BambooHR API key has **read permissions** for:
  - Employee directory
  - Time-off data
  - Department information

### **Issue 4: Configuration File Location**

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

## 🚀 **Expected Behavior After Fix**

Once properly configured, you should see:

✅ **Success Messages**: Tools return employee data, departments, etc.  
✅ **No 401 Errors**: Authentication works properly  
✅ **Rich Data**: Employee details, time-off calendars, analytics

## 📞 **Additional Support**

If issues persist after configuration:

1. **Check BambooHR API Status**: Verify your API key works directly
2. **Permissions**: Ensure adequate API permissions in BambooHR
3. **Network**: Check corporate firewall/proxy settings
4. **Logs**: Monitor Claude Desktop logs for detailed error messages

## 🔧 **Manual Testing Command**

To test your credentials outside Claude Desktop:

```bash
# Set environment variables
export BAMBOO_API_KEY="your_api_key"
export BAMBOO_SUBDOMAIN="your_subdomain"

# Run the server directly
cd /path/to/bamboo-mcp-server
node server/index.js
```

---

**Status**: ❌ **CONFIGURATION REQUIRED**  
**Next Step**: Configure BambooHR credentials in Claude Desktop  
**Priority**: **HIGH** - All tools non-functional until resolved
