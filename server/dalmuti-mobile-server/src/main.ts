import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createWinstonLogger } from './logger/winston.factory';
import { NestWinstonLogger } from './logger/nest-winston-logger.service';
import { RedisIoAdapter } from './redis-io.adapter';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const winstonLogger = createWinstonLogger();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true,
    logger: new NestWinstonLogger(winstonLogger),
  });
  // All REST endpoints are under /api
  app.setGlobalPrefix('api');

  // Serve frontend build if present (Vite React SPA)
  const frontendDist = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
  if (fs.existsSync(frontendDist)) {
    app.useStaticAssets(frontendDist);
    const appRef: any = app.getHttpAdapter().getInstance();
    appRef.get('*', (req: any, res: any, next: any) => {
      if (req?.path?.startsWith('/api') || req?.path?.startsWith('/socket.io')) return next();
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  // Redis URL이 설정되면 Redis 어댑터 사용(멀티 인스턴스 간 소켓 이벤트 동기화)
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    const redisAdapter = new RedisIoAdapter(app);
    app.useWebSocketAdapter(redisAdapter);
  }
  await app.listen(port);
  // 콘솔 대신 구조화된 로거로 기록
  // 시작 시점 로그를 명시적으로 남겨 로그 파일 생성/포맷을 보장
  winstonLogger.info(`Dalmuti server running at http://localhost:${port}`, { context: 'Bootstrap' });
}

bootstrap();
