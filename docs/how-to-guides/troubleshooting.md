# Troubleshooting

## Common Issues

### "Server not found" in Claude Desktop
1. Check file path in config is absolute (not relative)
2. Verify Node.js is installed: `node --version`
3. Rebuild: `./scripts/build.sh`

### "Authentication failed" 
1. Verify API key is copied correctly (no spaces)
2. Check subdomain (just company name, not full URL)
3. Test connection: `npm run test:connection`

### "No BambooHR tools available"
1. Restart Claude Desktop completely
2. Check config JSON syntax (use validator)
3. Look for errors in Claude Desktop logs

### Environment Variables Not Working
```bash
# Check if set correctly
echo $BAMBOO_API_KEY
echo $BAMBOO_SUBDOMAIN

# Set permanently in ~/.zshrc or ~/.bashrc
export BAMBOO_API_KEY="your_key"
export BAMBOO_SUBDOMAIN="your_subdomain"
source ~/.zshrc
```

### Build Errors
```bash
# Clean install
rm -rf node_modules dist
npm install
./scripts/build.sh
```

## Debug Steps

1. **Test API connection directly:**
   ```bash
   curl -H "Authorization: Basic $(echo -n "${BAMBOO_API_KEY}:x" | base64)" \
        "https://api.bamboohr.com/api/gateway.php/${BAMBOO_SUBDOMAIN}/v1/meta/fields"
   ```

2. **Check logs:**
   - Claude Desktop: View → Developer → Show Logs
   - Server logs: Run with `DEBUG=* node dist/bamboo-mcp.js`

3. **Validate setup:**
   ```bash
   ./scripts/validate-setup.sh
   ```

## Still Need Help?

Open an issue with:
- Error message
- Node.js version
- Operating system
- Steps to reproduce