# 目标说明

开发一个专为 Claude Code / Cursor / MCP Client 定制的 MySQL MCP Server (`mysql-mcp-x`)，提供比现有开源方案更适合本地开发场景的体验。核心特性包括：启动即自动基于环境变量连接数据库（绝不允许使用 `connect_db`）、支持 MySQL 8+、提供带有清晰描述的基础查询与执行工具（`query`, `execute`, `schema`），并内置关键的 SQL 安全防护措施（如自动事务、防止危险 SQL 及查询限制）。

## 需要用户审核的内容

本计划已根据您的最新补充要求进行了全面更新：
> [!IMPORTANT]
> 1. 环境依赖：Node.js 20+ 和 TypeScript，请确认您的本地环境已安装 Node.js 20+。
> 2. `query` 工具将被严格限制为仅能执行 `SELECT` 语句，任何其他语句（如 UPDATE/DELETE/INSERT/DROP 等）都将被拦截。
> 3. `execute` 工具将自动包裹事务（BEGIN/COMMIT/ROLLBACK），并继续拦截无 WHERE 的更新/删除以及 DROP/TRUNCATE/ALTER 操作。
> 4. 所有工具已配备专为 Claude Code 优化的高质量英文 Description，以确保 LLM 准确理解其功能。

## 待确认问题（Open Questions）

> [!NOTE]
> 目前的所有疑问均已明确。如您确认本计划无误，我们将立刻开始完整项目的生成。我们会在执行过程中按您的要求，为每个文件输出完整的可运行代码。

## 提议的变更

项目将按照推荐的目录结构进行组织，所有生成的文件将是完整的、无需修改即可运行的代码。

### 1. 项目核心配置

#### [NEW] package.json
配置包名为 `mysql-mcp-x`，包含 `scripts`: `dev`, `build`, `start`, `lint`, `format`。引入相关的 npm 依赖（包括 `eslint`, `prettier` 及其相关插件）。

#### [NEW] tsconfig.json
严格模式 TypeScript 编译配置 (`strict=true`)，目标设为 `ES2022`，`moduleResolution=node`，`outDir=dist`。

#### [NEW] .prettierrc
配置基础的 Prettier 格式化规范。

#### [NEW] .eslintrc.json
配置 ESLint，集成 Prettier 以避免冲突。配置规则：
- TypeScript 严格模式校验
- `import` 排序 (`eslint-plugin-import`)
- `no-unused-vars` (使用 `@typescript-eslint/no-unused-vars`)
- `async/await` 规范 (例如 `@typescript-eslint/await-thenable`, `require-await` 等)

### 2. 源码实现

#### [NEW] src/index.ts
入口文件，负责初始化名为 `mysql-mcp-x` (version `1.0.0`) 的 MCP Server，注册并绑定所有的 Tools，并处理 stdio 传输层。

#### [NEW] src/mysql.ts
数据库连接池封装，基于 `mysql2/promise`。
- 启动时**自动读取环境变量**初始化连接池，绝对不提供 `connect_db`。
- 自动重连与连接池配置。
- 完善的日志记录。

#### [NEW] src/tools/query.ts
实现 `query` 工具，配置精确描述：`"Execute safe SELECT SQL queries against MySQL database."`
- **安全拦截**：仅允许 SELECT。严格检测并拦截 UPDATE, DELETE, INSERT, DROP, ALTER, TRUNCATE 等危险 SQL。
- **自动限制**：若无 LIMIT，则自动追加 `LIMIT 200`。
- 执行查询并返回 JSON 结果。

#### [NEW] src/tools/execute.ts
实现 `execute` 工具，配置精确描述：`"Execute INSERT/UPDATE/DELETE SQL statements with built-in safety protections."`
- **自动事务**：执行前 `BEGIN`，成功则 `COMMIT`，失败则 `ROLLBACK`。
- **安全拦截**：禁止 DROP, TRUNCATE, ALTER, CREATE/DROP DATABASE 等。强制检查 UPDATE 和 DELETE 语句是否包含 WHERE 子句。
- 返回 `affectedRows`, `insertId`, `warningStatus`。

#### [NEW] src/tools/schema.ts
实现 `schema` 工具，配置精确描述：`"Inspect database tables and table structures."`
- 参数为空时：执行 `SHOW TABLES`。
- 提供 `table` 参数时：执行 `DESCRIBE <table>` 与 `SHOW CREATE TABLE <table>`。
- 自动合并并格式化输出结果。

### 3. 文档

#### [NEW] README.md
提供完整的说明文档，包含：
- 安装与运行方式 (`npm install`, `npm run build`, `npm start`)
- Claude Code 完整的 JSON 配置示例
- **安全说明**：详细解释为什么默认禁止 DROP、TRUNCATE、无 WHERE 的更新，以及为什么 query 自动限制 200 行。

## 验证计划

执行完毕后，项目将满足以下验证标准：
- 执行 `npm install`, `npm run build`, `npm start` 可成功无误地运行。
- 代码符合 ESLint 和 Prettier 规范（通过 `npm run lint` 和 `npm run format` 验证不会报错）。
- Server 启动后无需提供任何连接参数即可响应查询。
