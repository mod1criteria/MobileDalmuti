import { User } from "../user/user";

export class Room {
    private roomId: string;
    private roomName: string;
    private userList: User[] = [];

    private constructor(roomId: string, roomName: string) {
        this.roomId = roomId;
        this.roomName = roomName;
    }

    getRoomId(): string {
        return this.roomId;
    }

    joinRoom(user: User): void {
        this.userList.push(user);
    }

    leaveRoom(user: User): void {
        this.userList = this.userList.filter(u => u !== user);
    }

    static CreateRoom(roomId: string, roomName: string, user: User): Room {
        return new Room(roomId, roomName);
    }
}