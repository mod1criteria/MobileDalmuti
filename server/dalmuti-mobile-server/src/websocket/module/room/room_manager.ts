import { User } from "../user/user";
import { Room } from "./room";

class RoomManager {
    private rooms: Map<string, Room>;

    constructor() {
        this.rooms = new Map();
    }

    public createRoom(roomName: string, user: User): Room {
        const roomId = this.generateRoomId();
        const room = Room.CreateRoom(roomId, roomName, user);
        this.rooms.set(roomId, room);
        return room;
    }

    public getRoom(roomId: string): Room | undefined {
        return this.rooms.get(roomId);
    }

    public deleteRoom(roomId: string): boolean {
        return this.rooms.delete(roomId);
    }

    public listRooms(): string[] {
        return Array.from(this.rooms.keys());
    }

    private generateRoomId(): string {
        let roomId = Math.random().toString(36).substring(2, 10);

        while (this.rooms.has(roomId)) {
            roomId = Math.random().toString(36).substring(2, 10);
        }
        return roomId;
    }
}

export const roomManager = new RoomManager();