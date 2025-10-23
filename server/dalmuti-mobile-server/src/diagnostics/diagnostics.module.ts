import { Module } from '@nestjs/common';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { GameGateway } from '../gateway/game.gateway';
import { DiagnosticsLogsController } from './diagnostics.logs.controller';

@Module({
  controllers: [DiagnosticsController, DiagnosticsLogsController],
  providers: [DiagnosticsService],
})
export class DiagnosticsModule {}
