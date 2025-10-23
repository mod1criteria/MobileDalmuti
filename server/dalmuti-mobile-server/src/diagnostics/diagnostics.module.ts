import { Module } from '@nestjs/common';
import { DiagnosticsController } from './diagnostics.controller';
import { DiagnosticsService } from './diagnostics.service';
import { GameGateway } from '../gateway/game.gateway';
import { DiagnosticsUiController } from './diagnostics.ui.controller';
import { DiagnosticsLogsController } from './diagnostics.logs.controller';

@Module({
  controllers: [DiagnosticsController, DiagnosticsUiController, DiagnosticsLogsController],
  providers: [DiagnosticsService],
})
export class DiagnosticsModule {}
