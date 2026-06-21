import { createApp } from './config/app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { syncIndexes } from './scripts/syncIndexes';
import { seedAdmin } from './scripts/seedAdmin';
import { seedMasters } from './scripts/seedMasters';

const startServer = async (): Promise<void> => {
  await connectDatabase();
  await syncIndexes();
  await seedAdmin();
  await seedMasters();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`📡 API: http://localhost:${env.PORT}/api`);
    console.log(`🏥 Health: http://localhost:${env.PORT}/health`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
    process.exit(1);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
