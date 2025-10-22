import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createWinstonLogger } from './logger/winston.factory';
import { NestWinstonLogger } from './logger/nest-winston-logger.service';

async function bootstrap() {
  const winstonLogger = createWinstonLogger();
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: new NestWinstonLogger(winstonLogger),
  });

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  // 콘솔 대신 구조화된 로거로 기록
  // 시작 시점 로그를 명시적으로 남겨 로그 파일 생성/포맷을 보장
  winstonLogger.info(`Dalmuti server running at http://localhost:${port}`, { context: 'Bootstrap' });
}

bootstrap();
