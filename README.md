# mysql-mcp-x

English | [简体中文](README.zh-CN.md)

A universal MySQL Model Context Protocol (MCP) server optimized for AI clients and assistants such as Claude Code, Cursor, Cline, Windsurf, and Claude Desktop.

It connects automatically to your database on startup (no `connect_db` tool call required), fully supports MySQL 8+, and comes with built-in SQL safety protections.

## Features

- ✅ **Zero-config Connection**: Automatically connects using environment variables right after starting.
- ✅ **MySQL 8 / 8.4+ Support**: Works seamlessly with `caching_sha2_password` authentication.
- ✅ **SQL Safety Guard**: Prevents destructive operations and auto-limits query result sizes.
- ✅ **Auto Transactions**: Executes INSERT/UPDATE/DELETE statements safely inside a transaction (BEGIN/COMMIT/ROLLBACK).
- ✅ **Connection Pool**: Powered by `mysql2`'s `createPool` with automatic reconnection.
- ✅ **Cross-platform**: Runs on Windows, macOS, and Linux.

## MCP Tools

| Tool | Description |
|------|-------------|
| `query` | Execute safe SELECT SQL queries against MySQL database. |
| `execute` | Execute INSERT/UPDATE/DELETE SQL statements with built-in safety protections. |
| `schema` | Inspect database tables and table structures. |

## Installation

```bash
npm install
npm run build
```

## Usage

### Launch with npx
```bash
npx mysql-mcp-x
```

### Local Development
```bash
npm run dev
```

### Build and Start
```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_HOST` | MySQL server host address | `localhost` |
| `MYSQL_PORT` | MySQL server port | `3306` |
| `MYSQL_USER` | Database username | `root` |
| `MYSQL_PASSWORD`| Database password | (empty) |
| `MYSQL_DATABASE` | Database name | (empty) |
| `MYSQL_CONNECTION_LIMIT` | Max database connections in the pool | `10` |

## Integration Configurations

Add the server to your client's config file (e.g., `claude_desktop_config.json`):

### Windows
Config path: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mysql-mcp-x": {
      "command": "npx",
      "args": [
        "-y",
        "mysql-mcp-x"
      ],
      "env": {
        "MYSQL_HOST": "127.0.0.1",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "your_database"
      }
    }
  }
}
```

### macOS / Linux
Config path: `~/.claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mysql-mcp-x": {
      "command": "npx",
      "args": [
        "-y",
        "mysql-mcp-x"
      ],
      "env": {
        "MYSQL_HOST": "127.0.0.1",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "your_database"
      }
    }
  }
}
```

### Development Mode (Running from Source)

```json
{
  "mcpServers": {
    "mysql-mcp-x": {
      "command": "node",
      "args": [
        "d:/DevWork/Code/my/mcp/mysql-mcp/dist/index.js"
      ],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "your_database"
      }
    }
  }
}
```

## Publishing to npm

```bash
# 1. Log in to npm
npm login

# 2. Build TypeScript
npm run build

# 3. Publish
npm publish
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Runs the server in development mode using `tsx` |
| `npm run build` | Compiles TypeScript source to `dist/` |
| `npm start` | Runs the compiled Javascript code |
| `npm run lint` | Lints files with ESLint |
| `npm run format`| Formats files with Prettier |

## Safety Explanations

### Why are DROP, TRUNCATE, and ALTER blocked by default?

In AI-assisted environments, LLMs can occasionally misunderstand intents or execute overly destructive queries. Preventing these safeguards your database from:
- **Accidental Table Loss**: `DROP TABLE` permanently destroys schemas and data.
- **Total Data Wipe**: `TRUNCATE TABLE` empties tables instantaneously without trigger firing or standard logging.
- **Schema Mutation**: `ALTER TABLE` operations might lead to data corruption or service compatibility issues.

If you must make schema modifications, please do so via dedicated client software (such as `mysql` CLI, Navicat, DBeaver, etc.).

### Why do UPDATE / DELETE statements require a WHERE clause?

Executing an UPDATE or DELETE without restrictions modifies all records in the table, which is rarely what the user wants. Enforcing the WHERE clause ensures:
- Target declaring impact is declared.
- LLM-generated SQL statements won't accidentally clear or overwrite the entire table.

### Why does query automatically apply LIMIT 200?

Retrieving huge datasets in MCP communication can lead to:
- **Context Window Exhaustion**: LLMs have token limits; massive outputs clog the conversation context.
- **Latency**: Large payloads slow down communications between the client and LLM.
- **Performance Overhead**: Higher RAM utilization for parsing JSON.

Applying `LIMIT 200` automatically keeps the response snappy while providing enough visual context. If you need more records, you can explicitly add a larger `LIMIT` in your SQL query.

### Why does execute use automatic transactions?

Wrapping execute queries with a transaction guarantees:
- **Atomicity**: The write operation either fully succeeds or cleanly rolls back.
- **No Partial States**: Prevents database state corruption if a part of a query fails.

## License

MIT
