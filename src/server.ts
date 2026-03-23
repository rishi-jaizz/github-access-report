import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const port = parseInt(env.PORT, 10);

const server = app.listen(port, '0.0.0.0', () => {
    logger.info(`Server is running on port ${port}`);
});

server.on('error', (err) => {
    logger.error('Server failed to start:', err);
});
