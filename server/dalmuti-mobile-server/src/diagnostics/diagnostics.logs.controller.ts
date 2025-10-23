import { Controller, Get, Header, Query } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';

@Controller('diag/logs')
export class DiagnosticsLogsController {
  constructor(private readonly svc: DiagnosticsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; charset=utf-8')
  logs(@Query('lines') lines?: string) {
    const n = lines ? parseInt(lines, 10) : 200;
    const { content = '', error } = this.svc.readLogTail(Number.isFinite(n) ? n : 200) as any;
    return error ? String(error) : content;
  }
}

