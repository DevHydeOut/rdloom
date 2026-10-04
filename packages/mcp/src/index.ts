#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.ts";

// stdout carries the protocol; anything for humans goes to stderr.
await createServer().connect(new StdioServerTransport());
console.error("rdloom MCP server running on stdio");
