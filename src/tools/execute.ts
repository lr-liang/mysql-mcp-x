import { executeWrite } from '../mysql.js';

/**
 * 禁止的危险 SQL 关键字
 */
const FORBIDDEN_KEYWORDS = [
  'DROP',
  'TRUNCATE',
  'ALTER',
  'CREATE DATABASE',
  'DROP DATABASE',
  'RENAME',
  'GRANT',
  'REVOKE',
];

/**
 * SQL 安全检查 - execute 工具
 */
export function validateExecuteSql(sql: string): void {
  const trimmed = sql.trim().toUpperCase();

  // 移除字符串字面量后检测
  const sqlWithoutStrings = trimmed.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');

  // 检测禁止的关键字
  for (const keyword of FORBIDDEN_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword.replace(' ', '\\s+')}\\b`, 'i');
    if (regex.test(sqlWithoutStrings)) {
      throw new Error(`[安全拦截] 检测到危险操作 "${keyword}"。此操作已被禁止以保护数据库安全。`);
    }
  }

  // 禁止 SELECT 语句（应使用 query 工具）
  if (trimmed.startsWith('SELECT')) {
    throw new Error(`[安全拦截] execute 工具不支持 SELECT 查询。请使用 query 工具执行查询操作。`);
  }

  // 检测无 WHERE 的 DELETE
  if (trimmed.startsWith('DELETE')) {
    if (!sqlWithoutStrings.includes('WHERE')) {
      throw new Error(`[安全拦截] DELETE 语句必须包含 WHERE 子句。不允许执行无条件删除操作。`);
    }
  }

  // 检测无 WHERE 的 UPDATE
  if (trimmed.startsWith('UPDATE')) {
    if (!sqlWithoutStrings.includes('WHERE')) {
      throw new Error(`[安全拦截] UPDATE 语句必须包含 WHERE 子句。不允许执行无条件更新操作。`);
    }
  }
}

/**
 * 执行 execute 工具 - 自动包裹事务
 */
export async function handleExecute(sql: string): Promise<string> {
  // 1. 安全校验
  validateExecuteSql(sql);

  // 2. 在事务中执行（mysql.ts 中已封装 BEGIN/COMMIT/ROLLBACK）
  const result = await executeWrite(sql);

  // 3. 返回结果
  return JSON.stringify(
    {
      success: true,
      affectedRows: result.affectedRows,
      insertId: result.insertId,
      warningStatus: result.warningStatus,
    },
    null,
    2,
  );
}
