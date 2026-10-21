type TransactionStep = { query: any; rows: boolean };

export const transactionRows = (query: any): TransactionStep => ({ query, rows: true });
export const transactionWrite = (query: any): TransactionStep => ({ query, rows: false });

// SQLite must complete its callback synchronously; PostgreSQL awaits each query.
export function runTransaction<T>(database: any, work: (tx: any) => Generator<TransactionStep, T, any>, asynchronous = false): T | Promise<T> {
  if (asynchronous) {
    return database.transaction(async (tx: any) => {
      const operations = work(tx);
      let step = operations.next();
      while (!step.done) step = operations.next(await step.value.query);
      return step.value;
    });
  }
  return database.transaction((tx: any) => {
    const operations = work(tx);
    let step = operations.next();
    while (!step.done) {
      const { query, rows } = step.value;
      step = operations.next(rows ? query.all() : query.run());
    }
    return step.value;
  });
}
