import mysql, { Pool, PoolOptions, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

/**
 * 日志工具 - 使用 console.error 以避免干扰 MCP 的 stdout JSON-RPC 通信
 */
const log = {
  info: (msg: string, ...args: unknown[]) => console.error(`[INFO] ${msg}`, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(`[ERROR] ${msg}`, ...args),
  warn: (msg: string, ...args: unknown[]) => console.error(`[WARN] ${msg}`, ...args),
  sql: (msg: string, ...args: unknown[]) => console.error(`[SQL] ${msg}`, ...args),
};

/**
 * 数据库连接池 - 基于环境变量自动初始化
 * 启动即连接，不提供 connect_db
 */
let pool: Pool;

/**
 * 从环境变量初始化连接池配置
 */
function getPoolConfig(): PoolOptions {
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || '3306', 10);
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || '';
  const connectionLimit = parseInt(process.env.MYSQL_CONNECTION_LIMIT || '10', 10);

  if (!database) {
    log.warn('MYSQL_DATABASE 环境变量未设置，某些操作可能失败');
  }

  return {
    host,
    port,
    user,
    password,
    database,
    connectionLimit,
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  };
}

/**
 * 初始化数据库连接池 - 启动时自动调用
 */
export function initPool(): Pool {
  const config = getPoolConfig();

  log.info(
    `正在连接数据库 ${config.user}@${config.host}:${config.port}/${config.database || '(未指定)'}`,
  );

  pool = mysql.createPool(config);

  // 监听连接池事件
  pool.on('connection', () => {
    log.info('新的数据库连接已建立');
  });

  log.info('数据库连接池初始化成功');

  return pool;
}

/**
 * 获取连接池实例
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('数据库连接池未初始化，请检查环境变量配置');
  }
  return pool;
}

/**
 * 测试数据库连接
 */
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    log.info('数据库连接测试成功');
    return true;
  } catch (error) {
    log.error('数据库连接测试失败:', error);
    return false;
  }
}

/**
 * 执行 SELECT 查询
 */
export async function executeQuery(sql: string): Promise<RowDataPacket[]> {
  log.sql(`执行查询: ${sql}`);
  const [rows] = await getPool().query<RowDataPacket[]>(sql);
  log.sql(`查询返回 ${rows.length} 行`);
  return rows;
}

/**
 * 在事务中执行写操作 (INSERT/UPDATE/DELETE)
 */
export async function executeWrite(sql: string): Promise<ResultSetHeader> {
  const connection = await getPool().getConnection();
  try {
    log.sql(`开始事务`);
    await connection.beginTransaction();

    log.sql(`执行写操作: ${sql}`);
    const [result] = await connection.execute<ResultSetHeader>(sql);

    await connection.commit();
    log.sql(`事务提交成功 - affectedRows: ${result.affectedRows}, insertId: ${result.insertId}`);

    return result;
  } catch (error) {
    await connection.rollback();
    log.error(`事务回滚:`, error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * 关闭连接池
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    log.info('数据库连接池已关闭');
  }
}
