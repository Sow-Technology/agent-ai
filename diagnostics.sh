#!/bin/bash

# Diagnostic script for Google Generative AI API issues
# Run this on your Google Cloud VM to diagnose the 500/503 errors

echo "=== Agent AI Diagnostics ===" 
echo "Time: $(date)"
echo ""

echo "1. Check Environment Variables"
echo "================================"
if [ -z "$GOOGLE_GENAI_API_KEY" ]; then
  echo "❌ GOOGLE_GENAI_API_KEY is NOT set"
else
  echo "✓ GOOGLE_GENAI_API_KEY is set (length: ${#GOOGLE_GENAI_API_KEY})"
  # Show first and last 4 chars (safe way to verify)
  key_display="${GOOGLE_GENAI_API_KEY:0:4}...${GOOGLE_GENAI_API_KEY: -4}"
  echo "  Value: $key_display"
fi

if [ -z "$GOOGLE_AI_API_KEY" ]; then
  echo "❌ GOOGLE_AI_API_KEY is NOT set"
else
  echo "✓ GOOGLE_AI_API_KEY is set"
fi

echo ""
echo "2. Check Node.js Memory"
echo "================================"
node_memory=$(pm2 show 0 | grep "memory" || echo "N/A")
echo "PM2 Process Memory: $node_memory"
free -h
echo ""

echo "3. Check Nginx Configuration"
echo "================================"
client_max=$(grep -i "client_max_body_size" /etc/nginx/nginx.conf /etc/nginx/sites-available/* 2>/dev/null | head -5)
if [ -z "$client_max" ]; then
  echo "⚠️  No explicit client_max_body_size found (default is 1MB)"
else
  echo "✓ Found client_max_body_size settings:"
  echo "$client_max"
fi
echo ""

echo "4. Test Google AI API Directly"
echo "================================"
echo "Testing API connectivity..."

if [ -z "$GOOGLE_GENAI_API_KEY" ]; then
  echo "❌ Cannot test - API key not set"
else
  # Test basic API call
  curl -s -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=$GOOGLE_GENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
    -w "\nHTTP Status: %{http_code}\n" | head -20
fi

echo ""
echo "5. Check PM2 Logs for Errors"
echo "================================"
echo "Last 50 error lines:"
tail -50 /root/.pm2/logs/agent-ai-error.log | grep -i "error\|failed\|500\|503" || echo "No recent errors"

echo ""
echo "6. Check Network Connection"
echo "================================"
echo "Testing DNS resolution:"
nslookup generativelanguage.googleapis.com || echo "DNS lookup failed"
echo ""
echo "Testing connectivity to Google AI API:"
curl -s -I https://generativelanguage.googleapis.com -w "HTTP Status: %{http_code}\n" | head -5

echo ""
echo "7. Check Node.js Running"
echo "================================"
pm2 status

echo ""
echo "=== END DIAGNOSTICS ===" 
echo ""
echo "Troubleshooting Steps:"
echo "1. Verify GOOGLE_GENAI_API_KEY is set correctly in .env or system"
echo "2. Check if API key has quota remaining in Google Cloud Console"
echo "3. Verify API is enabled: generativelanguage.googleapis.com"
echo "4. Check if there are rate limiting issues"
echo "5. For large audio: ensure client_max_body_size >= 500M in nginx"
