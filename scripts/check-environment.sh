#!/bin/bash

# BambooHR Environment Variables Checker
# Ensures BAMBOO_API_KEY and BAMBOO_SUBDOMAIN are properly configured

set -e

echo "🔍 Checking BambooHR environment variables..."

# Check if required environment variables are set
if [[ -z "$BAMBOO_API_KEY" ]]; then
    echo "❌ BAMBOO_API_KEY is not set"
    echo "💡 Please set your BambooHR API key:"
    echo "   export BAMBOO_API_KEY='your_api_key_here'"
    exit 1
else
    echo "✅ BAMBOO_API_KEY is set (${#BAMBOO_API_KEY} characters)"
fi

if [[ -z "$BAMBOO_SUBDOMAIN" ]]; then
    echo "❌ BAMBOO_SUBDOMAIN is not set"
    echo "💡 Please set your BambooHR subdomain:"
    echo "   export BAMBOO_SUBDOMAIN='your_company_subdomain'"
    exit 1
else
    echo "✅ BAMBOO_SUBDOMAIN is set: $BAMBOO_SUBDOMAIN"
fi

echo ""
echo "🔌 Testing BambooHR API connection..."

# Test API connectivity
response=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "Authorization: Basic $(echo -n "${BAMBOO_API_KEY}:x" | base64)" \
    -H "Accept: application/json" \
    "https://api.bamboohr.com/api/gateway.php/${BAMBOO_SUBDOMAIN}/v1/meta/fields")

if [[ "$response" == "200" ]]; then
    echo "✅ BambooHR API connection successful!"
    echo "✅ Your BambooHR instance is accessible"
else
    echo "❌ BambooHR API connection failed (HTTP $response)"
    echo "⚠️  Please check:"
    echo "   - Your API key is valid"
    echo "   - Your subdomain is correct"
    echo "   - Your BambooHR account has API access"
    exit 1
fi

echo ""
echo "🎉 All environment checks passed!"
echo ""
echo "📋 You can now use the BambooHR MCP server with Claude Desktop"