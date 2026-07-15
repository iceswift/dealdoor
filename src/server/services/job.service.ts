import { createId } from '@paralleldrive/cuid2';
import { and, desc, eq, lte } from 'drizzle-orm';
import { db } from '../../lib/db';
import { jobLocks, jobRuns } from '../../lib/db-schema';

export type JobResult = {
  status: 'succeeded' | 'failed' | 'skipped';
  runId?: string;
  durationMs?: number;
  error?: string;
};

async function acquireJobLock(name: string, ownerToken: string, lockDurationMs: number) {
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + lockDurationMs);

  await db.insert(jobLocks).values({ name, ownerToken, lockedUntil, updatedAt: now }).onConflictDoNothing();
  const current = await db.query.jobLocks.findFirst({ where: eq(jobLocks.name, name) });
  if (current?.ownerToken === ownerToken) return true;
  if (!current || current.lockedUntil > now) return false;

  await db.update(jobLocks)
    .set({ ownerToken, lockedUntil, updatedAt: now })
    .where(and(eq(jobLocks.name, name), lte(jobLocks.lockedUntil, now)));

  const renewed = await db.query.jobLocks.findFirst({ where: eq(jobLocks.name, name) });
  return renewed?.ownerToken === ownerToken;
}

async function releaseJobLock(name: string, ownerToken: string) {
  await db.delete(jobLocks).where(and(eq(jobLocks.name, name), eq(jobLocks.ownerToken, ownerToken)));
}

export async function runExclusiveJob(name: string, job: () => Promise<unknown>, lockDurationMs = 10 * 60 * 1000): Promise<JobResult> {
  const ownerToken = createId();
  const acquired = await acquireJobLock(name, ownerToken, lockDurationMs);
  if (!acquired) return { status: 'skipped' };

  const runId = createId();
  const startedAt = new Date();
  await db.insert(jobRuns).values({ id: runId, name, status: 'running', startedAt });

  try {
    const output = await job();
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    await db.update(jobRuns)
      .set({ status: 'succeeded', finishedAt, durationMs, output: output === undefined ? null : JSON.stringify(output) })
      .where(eq(jobRuns.id, runId));
    return { status: 'succeeded', runId, durationMs };
  } catch (error) {
    const finishedAt = new Date();
    const durationMs = finishedAt.getTime() - startedAt.getTime();
    const message = error instanceof Error ? error.message : String(error);
    await db.update(jobRuns)
      .set({ status: 'failed', finishedAt, durationMs, error: message.slice(0, 2_000) })
      .where(eq(jobRuns.id, runId));
    return { status: 'failed', runId, durationMs, error: message };
  } finally {
    await releaseJobLock(name, ownerToken);
  }
}

export async function getRecentJobRuns(limit = 20) {
  return db.query.jobRuns.findMany({
    orderBy: [desc(jobRuns.startedAt)],
    limit: Math.min(100, Math.max(1, limit)),
  });
}
