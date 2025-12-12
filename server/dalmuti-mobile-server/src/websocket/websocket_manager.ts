import { Server as HttpServer } from "http";
import { IncomingMessage } from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { logger } from "../logger";
import { AuthMng, AUTH_KEY_TTL_MS } from "../module/auth/auth_manager";
import { Msg } from "../msg/msg_type";
import { userManager } from "../module/user/user_manager";
import { sendError, sendMsg } from "../msg/msg_builder";
import { ErrorCode } from "../error/dalmuti_error";
import { websocketEventBus, toWebSocketEventKey, WebSocketEvent } from "./websocket_event";
import { NetworkMng } from "../module/network/network_manager";


class WebSocketManager {
  // WebSocketManager 관련 메서드와 속성을 여기에 추가할 수 있습니다.
  public InitializeWebSocketServer(server: HttpServer) {
    const wss = new WebSocketServer({ server, path: "/ws" });
    AuthMng.initialize();
    NetworkMng.initialize();
    wss.on("connection", this.WebsocketInitialize.bind(this));

    return wss;
  }
  public WebsocketInitialize(socket: WebSocket, request: IncomingMessage) {
    // 새 접속 이벤트를 로깅합니다.
    this.LogConnectionEvent(request);

    // 환영 메시지와 인증 챌린지를 전송합니다.
    this.SendInitConnectMessage(socket);

    // 소켓 메시지 디스크립션을 설정합니다.
    socket.on("message", (data: RawData) => this.SubscribeSocketMessage(socket, data));
  }

  // 접속 이벤트를 클라이언트 IP와 함께 로깅합니다.
  private LogConnectionEvent(request: IncomingMessage, extra?: string) {
    const address = request.socket.remoteAddress ?? "unknown";
    const suffix = extra ? ` - ${extra}` : "";
    logger.log(`Client connected from ${address}${suffix}`.trim());
  };

  private SendInitConnectMessage(socket: WebSocket) {
    // 인증 모듈에 인증 챌린지 이벤트 전송.
    let event: WebSocketEvent = { socket, type: "auth", subtype: "auth_challenge", payload: { ttlMs: AUTH_KEY_TTL_MS } };
    websocketEventBus.emit(toWebSocketEventKey("auth", "auth_challenge"), event);
  };

  private SubscribeSocketMessage(socket: WebSocket, data: RawData) {
    const payload = this.ParseIncomingMessage(data);
    if (!payload) {
      sendError(socket, ErrorCode.INVALID_PAYLOAD_FORMAT); 
      return;
    }
    // 인증 키를 제외한 나머지 페이로드 데이터를 준비.
    const sanitizedPayload = this.StripAuthKey(payload);
    logger.log(`Received message: ${payload.type}`);

    const authKey = AuthMng.requireValidAuthKey(socket, payload);
    if (authKey === null) {
      return;
    }

    const event = {
      socket,
      authKey,
      type: payload.type,
      subtype: typeof payload.subtype === "string" ? payload.subtype : "",
      payload: sanitizedPayload,
    };

    websocketEventBus.emit(toWebSocketEventKey(event.type, event.subtype), event);

    // 기타 모든 메시지에 대해 확인 응답(ACK)을 전송.
    sendMsg(socket, { type: "network", subtype: "ack", payload });
  }

  private StripAuthKey(msg: Msg): object {
    if ("payload" in msg && typeof msg.payload === "object") {
      return msg.payload;
    }
    return {};
  };

  // 수신된 원시 데이터를 WebSocketPayload 형태로 파싱합니다.
private ParseIncomingMessage(data: RawData): Msg | null {
  try {
    const stringified = typeof data === "string" ? data : data.toString();
    const parsed = JSON.parse(stringified);
    if (typeof parsed?.type !== "string") {
      return null;
    }
    return parsed;
  } catch (error) {
    logger.error(
      `Failed to parse incoming WebSocket payload: ${(error as Error).message}`,
      (error as Error).stack,
    );
    return null;
  }
};
}



export const websocketMng = new WebSocketManager();