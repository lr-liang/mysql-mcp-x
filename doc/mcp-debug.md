# MCP 调试信息

## 1. MCP 命令行调试流程

1. 编译项目：
```shell
npm run build
```

2. 启动 MCP 服务（注入环境变量）：
```powershell
$env:MYSQL_HOST="localhost"
$env:MYSQL_PORT="3306"
$env:MYSQL_USER="root"
$env:MYSQL_PASSWORD="<your_password>"
$env:MYSQL_DATABASE="<your_database>"
node dist/index.js
```

3. 发送初始化 JSON：
```json
{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}
```

4. 查询可用 Tools：
```json
{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}
```

5. 查询表结构：
```json
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"schema","arguments":{"table":"users"}},"id":4}
```

6. 查询表数据：
```json
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"query","arguments":{"sql":"SELECT * FROM users LIMIT 3;"}},"id":5}
```

7. 执行 DDL / DML 示例：
```json
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"execute","arguments":{"sql":"ALTER TABLE users ADD COLUMN remark VARCHAR(255) DEFAULT NULL COMMENT '备注';"}},"id":6}
```

8. 插入示例数据：
```json
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"execute","arguments":{"sql":"INSERT INTO users (username,password,nickname,phone,email,avatar,gender,birth_date,status,register_source,last_login_time,is_deleted,created_at,updated_at) VALUES ('测试','<hashed_password>','孙七','13800138006','sunqi@example.com','https://example.com/avatar5.jpg',1,'1993-07-08',1,'web','2026-01-29 11:58:38',0,'2026-01-29 11:58:38','2026-01-29 11:58:38');"}},"id":7}
```

## 2. 官方 Inspector 工具调试

使用 `@modelcontextprotocol/inspector` 进行可视化调试：
```powershell
$env:MYSQL_HOST="localhost"; $env:MYSQL_PORT="3306"; $env:MYSQL_USER="root"; $env:MYSQL_PASSWORD="<your_password>"; $env:MYSQL_DATABASE="<your_database>"; npx @modelcontextprotocol/inspector node dist/index.js
```

打开 Inspector 提示的浏览器地址，可在网页上查看可用 Tools，并直接填写参数调用测试。

## 3. Dev 模式标准输入调试

如果项目已启动，可直接在控制台输入 JSON 请求：
```json
{"jsonrpc":"2.0","method":"tools/call","params":{"name":"execute","arguments":{"sql":"ALTER TABLE users ADD COLUMN remark VARCHAR(255) DEFAULT NULL COMMENT '备注';"}},"id":4}
```

## 4. 说明与注意

- 环境变量中的密码与数据库名称请使用自己的实际值，日志中不应泄露真实凭据。
- 启动后无需额外 `connect_db` 操作，MCP 应当直接连接数据库并提供 `query`、`execute`、`schema` 等工具。
- 调试时建议先使用 `tools/list` 确认可用工具，再调用具体 SQL 工具。
