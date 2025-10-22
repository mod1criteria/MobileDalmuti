import { LoggerService } from '@nestjs/common';
import type { Logger as WinstonLogger } from 'winston';

export class NestWinstonLogger implements LoggerService {
  constructor(private readonly logger: WinstonLogger) {}

  log(message: any, context?: string) {
    this.logger.info(typeof message === 'string' ? message : JSON.stringify(message), { context });
  }
  error(message: any, trace?: string, context?: string) {
    const msg = typeof message === 'string' ? message : JSON.stringify(message);
    this.logger.error(msg, { context, stack: trace });
  }
  warn(message: any, context?: string) {
    this.logger.warn(typeof message === 'string' ? message : JSON.stringify(message), { context });
  }
  debug(message: any, context?: string) {
    this.logger.debug(typeof message === 'string' ? message : JSON.stringify(message), { context });
  }
  verbose(message: any, context?: string) {
    this.logger.verbose(typeof message === 'string' ? message : JSON.stringify(message), { context });
  }
}

