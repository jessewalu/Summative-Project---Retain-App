// Entry point: prepare the database, then start listening.
import { createApp } from './app.js';
import { config } from './config.js';
import { pool } from './db.js';
import { setupDatabase } from './setup.js';

async function main() {
  await setupDatabase();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`Retain API listening on port ${config.port}`);
  });

  // Close the HTTP server and the DB pool cleanly when the host asks us to stop.
  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Failed to start the server:', err);
  process.exit(1);
});
