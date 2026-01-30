#!/usr/bin/env node
/**
 * Exa MCP Client
 * Calls Exa AI MCP server tools
 */

const MCP_BASE = "https://mcp.exa.ai/mcp";
const API_KEY = process.env.EXA_API_KEY;

if (!API_KEY) {
  console.error("Error: EXA_API_KEY environment variable required");
  process.exit(1);
}

const tools = {
  web_search: "web_search_exa",
  web_search_advanced: "web_search_advanced_exa",
  company_research: "company_research_exa",
  linkedin_search: "linkedin_search_exa",
  deep_search: "deep_search_exa",
  crawl: "crawling_exa",
  code_context: "get_code_context_exa",
  deep_research_start: "deep_researcher_start",
  deep_research_check: "deep_researcher_check"
};

async function callMCP(tool, params) {
  const response = await fetch(MCP_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      tool: tool,
      params: params
    })
  });

  if (!response.ok) {
    throw new Error(`MCP call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// CLI usage
const command = process.argv[2];
const args = process.argv.slice(3);

if (!command || command === "help") {
  console.log(`
Exa MCP Client

Usage: exa-mcp.js <command> [args]

Commands:
  search <query>              - Web search
  search-advanced <query>     - Advanced web search (with filters)
  company <company_name>      - Company research
  linkedin <query>            - LinkedIn search
  deep-search <query>         - Deep multi-query search
  crawl <url>                 - Crawl and extract page content
  code <query>                - Find code examples
  research-start <topic>      - Start deep research
  research-check <id>         - Check research progress

Examples:
  exa-mcp.js search "hostel SEO keywords Thailand"
  exa-mcp.js company "Mad Monkey Hostels"
  exa-mcp.js code "MEWS API integration"
  `);
  process.exit(0);
}

(async () => {
  try {
    let result;
    
    switch (command) {
      case "search":
        result = await callMCP(tools.web_search, { query: args.join(" ") });
        break;
      
      case "search-advanced":
        result = await callMCP(tools.web_search_advanced, { 
          query: args.join(" "),
          // Add filters as needed
        });
        break;
      
      case "company":
        result = await callMCP(tools.company_research, { company: args.join(" ") });
        break;
      
      case "linkedin":
        result = await callMCP(tools.linkedin_search, { query: args.join(" ") });
        break;
      
      case "deep-search":
        result = await callMCP(tools.deep_search, { query: args.join(" ") });
        break;
      
      case "crawl":
        result = await callMCP(tools.crawl, { url: args[0] });
        break;
      
      case "code":
        result = await callMCP(tools.code_context, { query: args.join(" ") });
        break;
      
      case "research-start":
        result = await callMCP(tools.deep_research_start, { topic: args.join(" ") });
        break;
      
      case "research-check":
        result = await callMCP(tools.deep_research_check, { research_id: args[0] });
        break;
      
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
    
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
})();
