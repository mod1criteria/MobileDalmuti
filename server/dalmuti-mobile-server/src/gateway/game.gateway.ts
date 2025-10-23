import { Logger, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomsService } from '../rooms/rooms.service';
import { CreateRoomDto, JoinRoomDto, LeaveRoomDto, ListRoomsDto } from './room.dtos';

type JoinPayload = { roomId: string; nickname?: string };
type ChatPayload = { roomId: string; message: string };

@WebSocketGateway({ namespace: '/ws', transports: ['websocket'], cors: { origin: '*' } })
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() public server!: Server;
  private readonly logger = new Logger(GameGateway.name);
  constructor(private readonly rooms: RoomsService) {}

  handleConnection(client: Socket) {
    this.logger.log(`connected ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`disconnected ${client.id}`);
    const { roomId, summary } = this.rooms.leaveBySocket(client.id);
    if (roomId && summary) this.server.emit('room:updated', summary);
  }

  @SubscribeMessage('join')
  async onJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: JoinPayload) {
    const { roomId } = payload || ({} as JoinPayload);
    if (!roomId) return { ok: false, error: 'roomId required' };
    await client.join(roomId);
    this.server.to(roomId).emit('system', { type: 'join', id: client.id });
    return { ok: true, roomId };
  }

  @SubscribeMessage('leave')
  async onLeave(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }) {
    const { roomId } = payload || ({} as any);
    if (!roomId) return { ok: false, error: 'roomId required' };
    await client.leave(roomId);
    this.server.to(roomId).emit('system', { type: 'leave', id: client.id });
    return { ok: true };
  }

  @SubscribeMessage('chat')
  async onChat(@ConnectedSocket() client: Socket, @MessageBody() payload: ChatPayload) {
    const { roomId, message } = payload || ({} as ChatPayload);
    if (!roomId || !message) return { ok: false, error: 'roomId and message required' };
    this.server.to(roomId).emit('chat', { from: client.id, message });
    return { ok: true };
  }

  // --- Rooms feature ---
  @SubscribeMessage('room:create')
  async onRoomCreate(@ConnectedSocket() client: Socket, @MessageBody() dto: CreateRoomDto) {
    // 기본 생성 + 생성자 자동 참가
    const summary = this.rooms.create(dto.title, dto.maxPlayers, client.id);
    await client.join(summary.id);
    this.server.emit('room:created', summary);
    return { ok: true, room: summary };
  }

  @SubscribeMessage('room:list')
  async onRoomList(@MessageBody() _dto: ListRoomsDto) {
    return { ok: true, rooms: this.rooms.list() };
  }

  @SubscribeMessage('room:join')
  async onRoomJoin(@ConnectedSocket() client: Socket, @MessageBody() dto: JoinRoomDto) {
    const check = this.rooms.canJoin(dto.roomId);
    if (!check.ok) return { ok: false, error: check.reason };
    const summary = this.rooms.join(dto.roomId, client.id);
    if (!summary) return { ok: false, error: 'not_found' };
    await client.join(dto.roomId);
    this.server.emit('room:updated', summary);
    return { ok: true, room: summary };
  }

  @SubscribeMessage('room:leave')
  async onRoomLeave(@ConnectedSocket() client: Socket, @MessageBody() dto: LeaveRoomDto) {
    const summary = this.rooms.leave(dto.roomId, client.id);
    await client.leave(dto.roomId);
    if (summary) this.server.emit('room:updated', summary);
    return { ok: true };
  }
}
