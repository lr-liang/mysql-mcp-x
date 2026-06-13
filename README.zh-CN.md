# mysql-mcp-x

[English](README.md) | 简体中文

基于 Model Context Protocol (MCP) 的通用 MySQL 服务端，专为 Claude Code、Cursor、Cline、Windsurf 等 AI 助手/客户端优化。

启动即连接数据库，无需 `connect_db`，支持 MySQL 8+，内置 SQL 安全防护。

## 功能特性

- ✅ **启动即连接** - 基于环境变量自动连接数据库，无需额外操作
- ✅ **支持 MySQL 8 / 8.4+** - 兼容 `caching_sha2_password`
- ✅ **SQL 安全防护** - 拦截危险操作，自动限制查询行数
- ✅ **自动事务** - execute 工具自动 BEGIN/COMMIT/ROLLBACK
- ✅ **连接池** - 基于 mysql2 createPool，支持自动重连
- ✅ **跨平台** - 支持 Windows / Mac / Linux

## MCP 工具

| 工具 | 说明 |
|------|------|
| `query` | 执行安全的 SELECT 查询，自动限制最大 200 行 |
| `execute` | 执行 INSERT/UPDATE/DELETE，自动包裹事务 |
| `schema` | 查看数据库表列表和表结构 |

## 安装

```bash
npm install
npm run build
```

## 使用方式

### 通过 npx 启动

```bash
npx mysql-mcp-x
```

### 本地开发

```bash
npm run dev
```

### 构建并启动

```bash
npm run build
npm start
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `MYSQL_HOST` | MySQL 主机地址 | `localhost` |
| `MYSQL_PORT` | MySQL 端口 | `3306` |
| `MYSQL_USER` | MySQL 用户名 | `root` |
| `MYSQL_PASSWORD` | MySQL 密码 | (空) |
| `MYSQL_DATABASE` | 数据库名称 | (空) |
| `MYSQL_CONNECTION_LIMIT` | 连接池最大连接数 | `10` |
| `MYSQL_MCP_DISABLE_SQL_SAFE_MODE` | 设置为 `1` / `true` / `on` 时禁用 execute 工具的安全保护 | `false` |

> 注意：默认情况下 execute 工具的安全保护处于开启状态。设置 `MYSQL_MCP_DISABLE_SQL_SAFE_MODE=1` 可关闭此保护，允许所有写操作。

## Claude Code 配置

在 Claude Code 中通过 `/mcp` 命令添加，或编辑配置文件：

### Windows

编辑 `%APPDATA%\Claude\claude_desktop_config.json`：

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
        "MYSQL_PASSWORD": "123456",
        "MYSQL_DATABASE": "mydb",
        "MYSQL_MCP_DISABLE_SQL_SAFE_MODE": "1"
      }
    }
  }
}
```

### Mac / Linux

编辑 `~/.claude/claude_desktop_config.json`：

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
        "MYSQL_PASSWORD": "123456",
        "MYSQL_DATABASE": "mydb",
        "MYSQL_MCP_DISABLE_SQL_SAFE_MODE": "1"
      }
    }
  }
}
```

### 本地开发模式配置

如果你是从源码运行，可以这样配置：

```json
{
  "mcpServers": {
    "mysql-mcp-x": {
      "command": "node",
      "args": [
        "d:/DevWork/Code/my/mcp/mysql-mcp-x/dist/index.js"
      ],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "123456",
        "MYSQL_DATABASE": "mydb",
        "MYSQL_MCP_DISABLE_SQL_SAFE_MODE": "1"
      }
    }
  }
}
```

## 发布到 npm

```bash
# 1. 登录 npm
npm login

# 2. 构建
npm run build

# 3. 发布
npm publish
```

## Scripts

| 命令 | 说明 |
|------|------|
| `npm run dev` | 使用 tsx 运行开发模式 |
| `npm run build` | 编译 TypeScript |
| `npm start` | 运行编译后的代码 |
| `npm run lint` | ESLint 代码检查 |
| `npm run format` | Prettier 代码格式化 |

## 安全说明

### 为什么默认禁止 DROP / TRUNCATE / ALTER？

在 AI 辅助开发场景中，LLM 可能因误解用户意图而生成破坏性 SQL 语句。禁止这些操作可以有效防止：

- **意外删除表** - `DROP TABLE` 会永久删除整个表及其数据
- **意外清空数据** - `TRUNCATE TABLE` 会删除表中所有数据且无法回滚
- **意外修改表结构** - `ALTER TABLE` 可能导致数据丢失或应用程序兼容性问题

如果确实需要执行这些操作，请直接使用 MySQL 客户端工具（如 mysql CLI、Navicat 等）进行操作。

### 为什么 UPDATE / DELETE 必须有 WHERE 子句？

无条件的 UPDATE 或 DELETE 会影响表中的所有行，这在绝大多数情况下并非用户本意。强制要求 WHERE 子句可以确保：

- 操作范围明确且可控
- 防止 LLM 生成的 SQL 意外修改或删除所有数据
- 每次操作都有明确的目标记录

### 为什么 query 自动限制 200 行？

在 MCP 通信场景中，大量数据返回会带来以下问题：

- **Token 消耗过大** - LLM 的上下文窗口有限，大量数据会快速耗尽
- **响应变慢** - 传输大量数据会显著增加响应时间
- **内存压力** - 大量 JSON 数据可能导致内存占用过高

自动追加 `LIMIT 200` 确保在大多数场景下都能获得足够的数据，同时保持良好的性能和用户体验。如果需要更多数据，用户可以在 SQL 中显式指定更大的 LIMIT 值。

### 为什么 execute 自动包裹事务？

自动事务（BEGIN/COMMIT/ROLLBACK）确保：

- **原子性** - 操作要么全部成功，要么全部回滚
- **安全性** - 执行失败时自动回滚，不会留下脏数据
- **可靠性** - 每次写操作都有明确的事务边界

## 许可证

MIT
