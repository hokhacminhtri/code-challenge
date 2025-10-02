import dotenv from 'dotenv';
import { app } from './app';

dotenv.config();

const port = Number(process.env.PORT) || 3000;

const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Books service listening on port ${port}`);
});

process.on('SIGINT', async () => {
  // eslint-disable-next-line no-console
  console.log('Received SIGINT. Shutting down gracefully.');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  // eslint-disable-next-line no-console
  console.log('Received SIGTERM. Shutting down gracefully.');
  server.close(() => process.exit(0));
});
