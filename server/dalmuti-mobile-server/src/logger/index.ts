import { createWinstonLogger } from './logger_factory';
import { Logger } from './logger_service';

const winstonLogger = createWinstonLogger();
export const logger = new Logger(winstonLogger);
