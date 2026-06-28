import morgan from 'morgan';
import { logger } from '../utils/logger';

export const loggerMiddleware = morgan(
  ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
  {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }
);
