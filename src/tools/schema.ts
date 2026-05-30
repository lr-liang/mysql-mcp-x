import { RowDataPacket } from 'mysql2/promise';

import { executeQuery } from '../mysql.js';

/**
 * 格式化表列表输出
 */
function formatTableList(rows: RowDataPacket[]): string {
  if (rows.length === 0) {
    return '当前数据库中没有表。';
  }

  // SHOW TABLES 返回的结果列名类似 "Tables_in_xxx"
  const firstRow = rows[0];
  if (!firstRow) {
    return '当前数据库中没有表。';
  }
  const columnName = Object.keys(firstRow)[0];
  if (!columnName) {
    return '当前数据库中没有表。';
  }
  const tables = rows.map((row) => row[columnName] as string);

  return JSON.stringify(
    {
      success: true,
      tableCount: tables.length,
      tables,
    },
    null,
    2,
  );
}

/**
 * 格式化表结构输出
 */
function formatTableStructure(
  tableName: string,
  describeRows: RowDataPacket[],
  createTableResult: string,
): string {
  const columns = describeRows.map((row) => ({
    field: row['Field'] as string,
    type: row['Type'] as string,
    null: row['Null'] as string,
    key: row['Key'] as string,
    default: row['Default'] as string | null,
    extra: row['Extra'] as string,
  }));

  return JSON.stringify(
    {
      success: true,
      table: tableName,
      columns,
      createTable: createTableResult,
    },
    null,
    2,
  );
}

/**
 * 执行 schema 工具
 */
export async function handleSchema(table?: string): Promise<string> {
  if (!table || table.trim() === '') {
    // 列出所有表
    const rows = await executeQuery('SHOW TABLES');
    return formatTableList(rows);
  }

  const tableName = table.trim();

  // 校验表名防止注入（仅允许字母、数字、下划线、点）
  if (!/^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)?$/.test(tableName)) {
    throw new Error(`[安全拦截] 无效的表名: "${tableName}"。表名仅允许字母、数字和下划线。`);
  }

  // 获取表结构
  const describeRows = await executeQuery(`DESCRIBE \`${tableName}\``);

  // 获取建表语句
  const createRows = await executeQuery(`SHOW CREATE TABLE \`${tableName}\``);
  const firstCreateRow = createRows[0];
  const createTableSql = firstCreateRow ? (firstCreateRow['Create Table'] as string) || '' : '';

  return formatTableStructure(tableName, describeRows, createTableSql);
}
