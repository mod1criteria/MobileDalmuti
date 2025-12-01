import { User } from "./user";
import WebSocket from "ws";

class UserManager {
    // authKey -> User 매핑
    private users = new Map<string, User>();
    
    // 새로운 사용자를 추가합니다.
    addUser(authKey: string, username: string, socket:WebSocket): void {
        try {
            const user = new User(username, authKey, socket);
            this.users.set(authKey, user);    
        } catch (error) {
            throw new Error(`Failed to add user: ${(error as Error).message}`);
        }
    }
    
    // 사용자 이름을 authKey로 조회합니다.
    getUsername(authKey: string): string  {
        let user: User | undefined = this.users.get(authKey);
        if (user === undefined) {
            throw new Error("User not found");
        }
        return user.getUserName();
    }
    
    // 사용자를 제거합니다.
    removeUser(authKey: string): void {
        this.users.delete(authKey);
    }
    
    // 모든 사용자를 반환합니다.
    getAllUsers(): Map<string, User> {
        return this.users;
    }
}

export const userManager = new UserManager();