你现在是一个资深 Node.js + TypeScript 工程师。

请帮我从零开发一个“Claude Code 专用”的 MySQL MCP Server。

目标：

这是一个给 Claude Code / Cursor / MCP Client 使用的数据库 MCP。
要求比现有开源 MySQL MCP 更适合本地开发场景。

# 技术要求

- 使用 TypeScript
- Node.js 20+
- 使用官方 MCP SDK
- 使用 mysql2
- 使用 stdio transport
- 支持 Windows / Mac / Linux
- 可通过 npx 启动
- package.json 配置完整
- README 完整
- 提供 Claude Code 配置示例

# 核心要求（非常重要）

必须实现：

## 1. 启动即连接数据库

不要 connect_db 模式。

MCP 启动后：
直接连接数据库。

Claude Code 可以直接：

“看看有哪些表”

而不是：

“请先 connect_db”

数据库连接信息来自环境变量：

MYSQL_HOST
MYSQL_PORT
MYSQL_USER
MYSQL_PASSWORD
MYSQL_DATABASE

启动时自动读取。

## 2. 必须支持 MySQL 8 / 8.4+

必须兼容：

caching_sha2_password

不要使用旧 mysql 驱动。
必须使用 mysql2/promise。

## 3. 提供以下 MCP Tools

### query

用于 SELECT 查询。

输入：

{
"sql": "SELECT ..."
}

返回：

JSON 格式结果。

------

### execute

用于 INSERT / UPDATE / DELETE。

输入：

{
"sql": "UPDATE ..."
}

返回：

affectedRows
insertId
warningStatus

------

### schema

查看：

- 表列表
- 表结构
- create table

支持：

{
"table": "order"
}

以及：

空参数时列出所有表。

# 安全要求（重要）

必须实现 SQL 安全保护。

默认禁止：

- DROP
- TRUNCATE
- ALTER
- CREATE DATABASE
- DROP DATABASE

execute tool 中：

禁止：

DELETE 没有 WHERE
UPDATE 没有 WHERE

如果违反：
返回明确错误。

# 查询保护

query 自动限制：

SELECT 最大返回 200 行。

如果用户 SQL 没写 LIMIT：
自动追加 LIMIT 200。

# 连接池

使用 mysql2 createPool。

要求：

- 自动重连
- 连接池
- connectionLimit 可配置

# 日志

输出：

- MCP 启动日志
- 数据库连接成功日志
- SQL 执行日志
- 错误日志

# Claude Code 兼容

Claude Code 中：

/mcp

应该看到：

- query
- execute
- schema

不允许出现：

connect_db

# 项目结构要求

请生成完整项目：

- package.json
- tsconfig.json
- src/index.ts
- src/mysql.ts
- src/tools/query.ts
- src/tools/execute.ts
- src/tools/schema.ts
- README.md

# README 要包含

- 安装方式
- npm publish 方式
- Claude Code 配置方式
- Windows 配置
- Mac/Linux 配置
- 环境变量说明

# Claude Code 配置示例

类似：

{
"mcpServers": {
"lr-mysql": {
"command": "npx",
"args": [
"-y",
"my-mysql-mcp"
],
"env": {
"MYSQL_HOST": "127.0.0.1",
"MYSQL_PORT": "3306",
"MYSQL_USER": "root",
"MYSQL_PASSWORD": "your_pwd",
"MYSQL_DATABASE": "your_db"
}
}
}
}

# 代码要求

- 类型完整
- 可直接运行
- 不要伪代码
- 不要省略
- 所有 import 完整
- 所有 npm 依赖完整
- 所有 Tool handler 完整
- 所有错误处理完整

# 最终目标

我希望：

Claude Code 中：

“看看有哪些表”
“查询订单表”
“更新订单状态”

都能直接工作。

并且：

- 启动即连接
- 不需要 connect_db
- 支持 MySQL8
- 比现有 MySQL MCP 更适合开发