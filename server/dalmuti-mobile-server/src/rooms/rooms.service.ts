import { Injectable } from '@nestjs/common';

export type RoomStatus = 'waiting' | 'playing';

export interface RoomSummary {
  id: string;
  title: string;
  status: RoomStatus;
  maxPlayers: number;
  currentPlayers: number;
}

interface Room {
  id: string;
  title: string;
  status: RoomStatus;
  maxPlayers: number;
  hostId: string;
  members: Set<string>; // socket ids
}

@Injectable()
export class RoomsService {
  private rooms = new Map<string, Room>();
  private membership = new Map<string, string>(); // socketId -> roomId

  private genId(): string {
    return Math.random().toString(36).slice(2, 8);
  }

  list(): RoomSummary[] {
    return Array.from(this.rooms.values()).map((r) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      maxPlayers: r.maxPlayers,
      currentPlayers: r.members.size,
    }));
  }

  getSummary(id: string): RoomSummary | undefined {
    const r = this.rooms.get(id);
    if (!r) return undefined;
    return {
      id: r.id,
      title: r.title,
      status: r.status,
      maxPlayers: r.maxPlayers,
      currentPlayers: r.members.size,
    };
  }

  create(title: string, maxPlayers: number, hostId: string): RoomSummary {
    const id = this.genId();
    const room: Room = {
      id,
      title,
      status: 'waiting',
      maxPlayers,
      hostId,
      members: new Set<string>(),
    };
    this.rooms.set(id, room);
    // creator joins by default
    this.join(id, hostId);
    return this.getSummary(id)!;
  }

  canJoin(id: string): { ok: boolean; reason?: string } {
    const r = this.rooms.get(id);
    if (!r) return { ok: false, reason: 'not_found' };
    if (r.status !== 'waiting') return { ok: false, reason: 'playing' };
    if (r.members.size >= r.maxPlayers) return { ok: false, reason: 'full' };
    return { ok: true };
  }

  join(id: string, socketId: string): RoomSummary | undefined {
    const r = this.rooms.get(id);
    if (!r) return undefined;
    r.members.add(socketId);
    this.membership.set(socketId, id);
    return this.getSummary(id);
  }

  leave(id: string, socketId: string): RoomSummary | undefined {
    const r = this.rooms.get(id);
    if (!r) return undefined;
    r.members.delete(socketId);
    this.membership.delete(socketId);
    return this.getSummary(id);
  }

  leaveBySocket(socketId: string): { roomId?: string; summary?: RoomSummary } {
    const roomId = this.membership.get(socketId);
    if (!roomId) return {};
    const summary = this.leave(roomId, socketId);
    return { roomId, summary };
  }
}
