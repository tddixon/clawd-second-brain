#!/usr/bin/env python3
"""Context7 API client for fetching up-to-date library documentation."""

import sys
import json
import urllib.request
import urllib.parse
import argparse

API_KEY = "ctx7sk-adbf30ec-dabe-4a6f-83de-d6e03912b517"
BASE_URL = "https://api.context7.com/v1"


def search(library_name: str):
    """Search for a library by name using mcporter MCP."""
    import subprocess
    try:
        result = subprocess.run(
            ["mcporter", "call", f'context7.resolve-library-id(query: "documentation for {library_name}", libraryName: "{library_name}")'],
            capture_output=True, text=True, timeout=30
        )
        print(result.stdout or result.stderr)
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        print(f"Error: {e}. Ensure mcporter is installed with context7 configured.")


def fallback_search(library_name: str):
    """Fallback search using mcporter MCP."""
    import subprocess
    result = subprocess.run(
        ["mcporter", "call", f'context7.resolve-library-id(query: "documentation", libraryName: "{library_name}")'],
        capture_output=True, text=True, timeout=30
    )
    print(result.stdout or result.stderr)


def context(library_id: str, query: str, output_type: str = "txt", tokens: int = 10000):
    """Fetch documentation context for a library."""
    # Try mcporter MCP first (most reliable)
    import subprocess
    try:
        result = subprocess.run(
            ["mcporter", "call", f'context7.query-docs(libraryId: "{library_id}", query: "{query}")'],
            capture_output=True, text=True, timeout=30
        )
        if result.stdout:
            print(result.stdout)
            return
        if result.stderr:
            print(result.stderr)
            return
    except (subprocess.TimeoutExpired, FileNotFoundError):
        pass

    # Fallback to web endpoint
    url = f"https://context7.com{library_id}/llms.txt?tokens={tokens}&topic={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers={"Accept": "text/plain"})
    try:
        with urllib.request.urlopen(req) as resp:
            print(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"Error: {e.code} {e.reason}")


def main():
    parser = argparse.ArgumentParser(description="Context7 Documentation Fetcher")
    subparsers = parser.add_subparsers(dest="command")

    # Search
    sp_search = subparsers.add_parser("search", help="Search for a library")
    sp_search.add_argument("library", help="Library name to search")

    # Context
    sp_ctx = subparsers.add_parser("context", help="Fetch documentation context")
    sp_ctx.add_argument("library_id", help="Library ID (e.g., /vercel/next.js)")
    sp_ctx.add_argument("query", help="Documentation query")
    sp_ctx.add_argument("--type", default="txt", choices=["txt", "md"], help="Output format")
    sp_ctx.add_argument("--tokens", type=int, default=10000, help="Max tokens")

    args = parser.parse_args()

    if args.command == "search":
        search(args.library)
    elif args.command == "context":
        context(args.library_id, args.query, args.type, args.tokens)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
