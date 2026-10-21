import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { integer, sqliteTable } from 'drizzle-orm/sqlite-core';
import { runTransaction, transactionRows, transactionWrite } from '../db-transaction';

const credits = sqliteTable('credits', { balance: integer('balance').notNull() });

describe('portable transactions', () => {
  it('commits dependent SQLite operations without returning a promise to SQLite', () => {
    const database = new Database(':memory:');
    database.exec('CREATE TABLE credits (balance INTEGER NOT NULL)');
    const balance = runTransaction(drizzle(database), function* (tx): Generator<any, number, any> {
      yield transactionWrite(tx.insert(credits).values({ balance: 5 }));
      const [row] = yield transactionRows(tx.select().from(credits));
      return row.balance;
    });
    expect(balance).toBe(5);
    expect(database.prepare('SELECT COUNT(*) AS count FROM credits').get()).toEqual({ count: 1 });
    database.close();
  });
  it('rolls back prior writes when a later SQLite operation fails', () => {
    const database = new Database(':memory:');
    database.exec('CREATE TABLE credits (balance INTEGER NOT NULL)');
    expect(() => runTransaction(drizzle(database), function* (tx): Generator<any, void, any> {
      yield transactionWrite(tx.insert(credits).values({ balance: 5 }));
      throw new Error('abort');
    })).toThrow('abort');
    expect(database.prepare('SELECT COUNT(*) AS count FROM credits').get()).toEqual({ count: 0 });
    database.close();
  });
  it('awaits query results for asynchronous drivers', async () => {
    const database = { transaction: async (callback: (tx: object) => Promise<unknown>) => callback({}) };
    const result = await runTransaction(database, function* (): Generator<any, number, any> {
      const [row] = yield transactionRows(Promise.resolve([{ balance: 7 }]));
      return row.balance;
    }, true);
    expect(result).toBe(7);
  });
});
