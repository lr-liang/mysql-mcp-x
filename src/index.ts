#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { closePool, initPool, testConnection } from './mysql.js';
import { handleExecute } from './tools/execute.js';
import { handleQuery } from './tools/query.js';
import { handleSchema } from './tools/schema.js';

/**
 * mysql-mcp-x - 通用且针对 AI 优化的 MySQL MCP Server
 *
 * 启动即连接数据库，不需要 connect_db。
 * 提供 query / execute / schema 三个工具。
 */

const SERVER_NAME = 'mysql-mcp-x';
const SERVER_VERSION = '1.0.0';

async function main(): Promise<void> {
  console.error(`[INFO] ${SERVER_NAME} v${SERVER_VERSION} 正在启动...`);

  // 1. 初始化数据库连接池 - 启动即连接
  initPool();

  // 2. 测试数据库连接
  const connected = await testConnection();
  if (!connected) {
    console.error('[WARN] 数据库连接测试失败，但服务将继续启动。请检查环境变量配置。');
  }

  // 3. 初始化 MCP Server
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // 4. 注册 query 工具
  server.tool(
    'query',
    'Execute safe SELECT SQL queries against MySQL database. Only SELECT/SHOW/DESCRIBE/EXPLAIN statements are allowed. Automatically appends LIMIT 200 if no LIMIT clause is specified. Returns results as JSON. Use this tool for reading data.',
    {
      sql: z
        .string()
        .describe('The SELECT SQL query to execute. Only read-only queries are allowed.'),
    },
    async ({ sql }) => {
      try {
        const result = await handleQuery(sql);
        return {
          content: [{ type: 'text', text: result }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: message }) }],
          isError: true,
        };
      }
    },
  );

  // 5. 注册 execute 工具
  server.tool(
    'execute',
    'Execute INSERT/UPDATE/DELETE SQL statements with built-in safety protections. Automatically wraps in a transaction (BEGIN/COMMIT/ROLLBACK). UPDATE and DELETE must include a WHERE clause. DROP, TRUNCATE, and ALTER statements are blocked. Returns affectedRows, insertId, and warningStatus.',
    {
      sql: z
        .string()
        .describe(
          'The INSERT/UPDATE/DELETE SQL statement to execute. Must include WHERE clause for UPDATE/DELETE.',
        ),
    },
    async ({ sql }) => {
      try {
        const result = await handleExecute(sql);
        return {
          content: [{ type: 'text', text: result }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: message }) }],
          isError: true,
        };
      }
    },
  );

  // 6. 注册 schema 工具
  server.tool(
    'schema',
    'Inspect database tables and table structures. When called without a table name, lists all tables in the database. When called with a table name, returns the column definitions (DESCRIBE) and the full CREATE TABLE statement.',
    {
      table: z
        .string()
        .optional()
        .describe(
          'Optional table name. If omitted, lists all tables. If provided, shows the structure and CREATE TABLE statement for the specified table.',
        ),
    },
    async ({ table }) => {
      try {
        const result = await handleSchema(table);
        return {
          content: [{ type: 'text', text: result }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: false, error: message }) }],
          isError: true,
        };
      }
    },
  );

  // 7. 启动 stdio 传输层
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error(`[INFO] ${SERVER_NAME} v${SERVER_VERSION} 已启动，等待 MCP 客户端连接...`);

  // 8. 优雅退出
  process.on('SIGINT', () => {
    console.error('[INFO] 收到 SIGINT，正在关闭...');
    void closePool().then(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    console.error('[INFO] 收到 SIGTERM，正在关闭...');
    void closePool().then(() => process.exit(0));
  });
}

main().catch((error) => {
  console.error('[FATAL] 服务启动失败:', error);
  process.exit(1);
});
