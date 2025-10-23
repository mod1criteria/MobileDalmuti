import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameGateway } from './gateway/game.gateway';
import { DiagnosticsModule } from './diagnostics/diagnostics.module';
import { RoomsService } from './rooms/rooms.service';

@Module({
  imports: [DiagnosticsModule],
  controllers: [AppController],
  providers: [AppService, GameGateway, RoomsService],
})
export class AppModule {}
