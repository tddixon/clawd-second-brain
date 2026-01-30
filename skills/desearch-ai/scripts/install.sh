#!/bin/bash
# Install Desearch AI MCP server via Smithery

echo "Installing Desearch AI MCP server..."
npx -y @smithery/cli@latest install @Desearch-ai/desearch --client claude-code

echo "✅ Desearch AI MCP installed"
echo ""
echo "Test with: npx @smithery/cli@latest playground @Desearch-ai/desearch"
