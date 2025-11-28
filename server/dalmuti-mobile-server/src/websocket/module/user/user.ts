import WebSocket from "ws";

export class User {
    private key: string;
    private userName: string;
    private socket: WebSocket;
    constructor(userName:string, key: string, socket: WebSocket) {
        //한글 or 영어 or 숫자 4 ~  12자리 제한
        const usernameRegex = /^[a-zA-Z0-9가-힣]{4,12}$/;
        if (!usernameRegex.test(userName)) {
            throw new Error("Invalid username. It must be 4-12 characters long and contain only Korean, English letters, or numbers.");
        }
        this.key = key;
        this.userName = userName;
        this.socket = socket;
    }

    public getUserName(): string {
        return this.userName;
    }
}