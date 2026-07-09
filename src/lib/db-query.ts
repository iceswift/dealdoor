type Rows<T> = PromiseLike<T[]> | T[];

export async function allRows<T>(rows: Rows<T>): Promise<T[]> {
  return rows;
}

export async function firstRow<T>(rows: Rows<T>): Promise<T | undefined> {
  const result = await allRows(rows);
  return result[0];
}
