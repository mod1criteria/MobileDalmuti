import { logger } from "../../logger";
import { sendMsg } from "../../msg/msg_builder";
import { toWebSocketEventKey, WebSocketEvent, websocketEventBus } from "../../websocket/websocket_event";

type NetworkPingPayload = {
    timestamp: string;
};

class NetworkManager {
    constructor() {
    }
    
    public initialize() {
        websocketEventBus.on(toWebSocketEventKey("network", "ping"), this.handlePingEvent.bind(this));
    }

    private handlePingEvent(event: WebSocketEvent) {
        if (!this.isNetworkPingPayload(event.payload)) {
            logger.error("Invalid ping payload", "NetworkManager");
            return;
        }
        let payload = event.payload as NetworkPingPayload;
        const timestamp = payload.timestamp ;
        logger.log(`Handling ping event in NetworkManager timestamp : ${timestamp}`, "NetworkManager");
        const serverTimestamp = this.formatTimestamp(new Date());
        sendMsg(event.socket, { type: "network", subtype: "pong", payload: { timestamp: serverTimestamp } });
    }

    private isNetworkPingPayload(payload: object): boolean {
        return typeof (payload as Partial<NetworkPingPayload>).timestamp === "string";
    }

    private formatTimestamp(date: Date): string {
        const pad = (value: number, size: number) => value.toString().padStart(size, "0");
        return `${date.getFullYear()}${pad(date.getMonth() + 1, 2)}${pad(date.getDate(), 2)}${pad(date.getHours(), 2)}${pad(date.getMinutes(), 2)}${pad(date.getSeconds(), 2)}${pad(date.getMilliseconds(), 3)}`;
    }
}

export const NetworkMng = new NetworkManager();