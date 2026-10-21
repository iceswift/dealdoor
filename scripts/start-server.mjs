if (process.env.DEMO_MODE === 'true') {
  await import('./start-demo.mjs');
} else {
  await import('../dist/server/entry.mjs');
}
