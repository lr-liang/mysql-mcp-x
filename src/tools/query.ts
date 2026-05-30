import { RowDataPacket } from 'mysql2/promise';

import { executeQuery } from '../mysql.js';

/**
 * SQL 安全检查 - query 仅允许 SELECT
 * 拦截所有危险关键字
 */
const FORBIDDEN_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'TRUNCATE',
  'CREATE',
  'REPLACE',
  'RENAME',
  'GRANT',
  'REVOKE',
];

export function validateQuerySql(sql: string): void {
  const trimmed = sql.trim().toUpperCase();

  // 必须以 SELECT 或 SHOW 或 DESCRIBE 或 EXPLAIN 开头
  if (
    !trimmed.startsWith('SELECT') &&
    !trimmed.startsWith('SHOW') &&
    !trimmed.startsWith('DESCRIBE') &&
    !trimmed.startsWith('DESC') &&
    !trimmed.startsWith('EXPLAIN')
  ) {
    throw new Error(
      `[安全拦截] query 工具仅允许 SELECT/SHOW/DESCRIBE/EXPLAIN 查询语句。` +
        `如需执行写操作，请使用 execute 工具。`,
    );
  }

  // 额外检测注入式危险关键字（防止 SELECT ... ; DROP TABLE ...）
  // 移除字符串字面量后检测
  const sqlWithoutStrings = trimmed.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '');

  for (const keyword of FORBIDDEN_KEYWORDS) {
    // 使用单词边界匹配，避免误匹配列名中包含关键字的情况
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(sqlWithoutStrings)) {
      throw new Error(
        `[安全拦截] query 工具中检测到危险关键字 "${keyword}"。` +
          `query 仅支持只读查询。如需执行写操作，请使用 execute 工具。`,
      );
    }
  }
}

/**
 * 自动追加 LIMIT - 如果 SQL 中没有 LIMIT 子句，自动追加 LIMIT 200
 */
export function autoAppendLimit(sql: string, maxRows: number = 200): string {
  const trimmed = sql.trim();
  const upper = trimmed.toUpperCase();

  // 仅对 SELECT 语句追加 LIMIT
  if (!upper.startsWith('SELECT')) {
    return trimmed;
  }

  // 检查是否已经有 LIMIT 子句（排除在子查询中的 LIMIT）
  // 移除括号内的内容后检查
  let depth = 0;
  let outerSql = '';
  for (const char of upper) {
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (depth === 0) outerSql += char;
  }

  if (!outerSql.includes('LIMIT')) {
    // 移除尾部分号后追加 LIMIT
    const cleaned = trimmed.replace(/;\s*$/, '');
    return `${cleaned} LIMIT ${maxRows}`;
  }

  return trimmed;
}

/**
 * 执行 query 工具
 */
export async function handleQuery(sql: string): Promise<string> {
  // 1. 安全校验
  validateQuerySql(sql);

  // 2. 自动追加 LIMIT
  const safeSql = autoAppendLimit(sql);

  // 3. 执行查询
  const rows: RowDataPacket[] = await executeQuery(safeSql);

  // 4. 返回格式化结果
  return JSON.stringify(
    {
      success: true,
      rowCount: rows.length,
      data: rows,
    },
    null,
    2,
  );
}
