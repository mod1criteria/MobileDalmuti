import { Controller, Get, Header } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getRoot(): string {
    return this.appService.getIndexHtml();
  }

  @Get('/health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}

