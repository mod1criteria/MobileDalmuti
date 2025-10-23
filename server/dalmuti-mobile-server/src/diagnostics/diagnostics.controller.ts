import { Body, Controller, Get, Header, Post, Query } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';

@Controller('diag')
export class DiagnosticsController {
  constructor(private readonly svc: DiagnosticsService) {}

  @Get()
  root() {
    return this.svc.getInfo();
  }

  @Get('redis')
  redis() {
    return this.svc.pingRedis();
  }

  @Get('ws')
  ws() {
    return this.svc.wsStats();
  }

  @Get('echo')
  echo(@Query('msg') msg?: string) {
    return { msg: msg || '' };
  }

  @Post('log')
  log(@Body() body: { level?: string; message?: string; context?: string }) {
    const level = (body.level || 'info') as any;
    const message = body.message || 'test log';
    const context = body.context || 'DiagHTTP';
    return this.svc.writeLogs(level, message, context);
  }

  
}
