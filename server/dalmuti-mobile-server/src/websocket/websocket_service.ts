import { Server as HttpServer } from "http";
import { IncomingMessage } from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { logger } from "../logger";
import { webSocketAuthManager, AUTH_KEY_TTL_MS } from "./auth/websocket_auth";
import { WebSocketPayloadType } from "./websocket_enum";
import { userManager } from "./user/user_manager";

const WEBSOCKET_SCOPE = "WebSocket";

export type WebSocketPayload = {
  type: WebSocketPayloadType;
  payload?: object;
  message?: string;
};



// HTTP 서버 위에 WebSocket 서버를 구성하고 이벤트를 처리합니다.
export const initializeWebSocketServer = (server: HttpServer) => {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket: WebSocket, request: IncomingMessage) => {
    logConnectionEvent("Client connected", request);

    // 환영 메시지와 인증 챌린지를 전송합니다.
    sendInitConnectMessage(socket);
    
    // 새 소켓에 인증 키를 발급하고 인증 챌린지를 전송합니다.
    socket.on("message", (data: RawData) => {
      const payload = parseIncomingMessage(data);
      if (!payload) {
        socket.send(
          serializeMessage({ type: WebSocketPayloadType.ERROR, message: "Invalid payload format" }),
        );
        return;
      }

      // 인증 키를 확인하고 유효하지 않으면 처리 중단.
      const authKey = requireValidAuthKey(socket, payload);
      if (!authKey) {
        return;
      }

      // 인증 키를 제외한 나머지 페이로드 데이터를 준비.
      const sanitizedPayload = stripAuthKey(payload);
      logger.log(`Received message: ${payload.type}`, WEBSOCKET_SCOPE);

      // 인증 검증 요청에 대해 인증 확인 응답을 전송.
      if (payload.type === WebSocketPayloadType.AUTH_VERIFY) {
        socket.send(
          serializeMessage({
            type: WebSocketPayloadType.AUTH_CONFIRMED,
            payload: { authKey, ttlMs: AUTH_KEY_TTL_MS },
          }),
        );
        return;
      }

      if(payload.type === WebSocketPayloadType.Login){
        userManager.addUser(authKey, (sanitizedPayload as any).username, socket);
        logger.log(`User logged in with authKey: ${authKey}`, WEBSOCKET_SCOPE);
        return;
      }

      // 핑 요청에 대해 퐁 응답을 전송.
      if (payload.type === WebSocketPayloadType.PING) {
        socket.send(
          serializeMessage({
            type: WebSocketPayloadType.PONG,
            payload: { authKey, echo: sanitizedPayload },
          }),
        );
        return;
      }

      // 기타 모든 메시지에 대해 확인 응답(ACK)을 전송.
      socket.send(
        serializeMessage({
          type: WebSocketPayloadType.ACK,
          payload: { authKey, receivedType: payload.type, receivedPayload: sanitizedPayload },
        }),
      );
    });

    socket.on("close", (code: number, reason: Buffer) => {
      // 소켓과 연결된 인증 키를 모두 회수합니다.
      let authKey = webSocketAuthManager.extractAuthKeyBySocket(socket)
      userManager.removeUser(authKey);
      webSocketAuthManager.revokeKeyBySocket(socket);
      logger.log(
        `Client disconnected (code=${code}, reason=${reason.toString() || "n/a"})`,
        WEBSOCKET_SCOPE,
      );
    });

    socket.on("error", (error: Error) => {
      logger.error(`WebSocket error: ${error.message}`, error.stack, WEBSOCKET_SCOPE);
    });
  });

  // 모든 연결된 클라이언트에 동일한 메시지를 전파합니다.
  const broadcast = (message: WebSocketPayload) => {
    const serialized = serializeMessage(message);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    });
  };

  return { wss, broadcast };
};

// WebSocket 메시지를 JSON 문자열로 변환하고 실패 시 안전한 에러 메시지를 반환합니다.
const serializeMessage = (message: WebSocketPayload): string => {
  try {
    return JSON.stringify(message);
  } catch (error) {
    logger.error(
      `Failed to serialize WebSocket message: ${(error as Error).message}`,
      (error as Error).stack,
      WEBSOCKET_SCOPE,
    );
    return JSON.stringify({ type: "error", payload: "Serialization failure" });
  }
};

// 수신된 원시 데이터를 WebSocketPayload 형태로 파싱합니다.
const parseIncomingMessage = (data: RawData): WebSocketPayload | null => {
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
      WEBSOCKET_SCOPE,
    );
    return null;
  }
};

// 접속 이벤트를 클라이언트 IP와 함께 로깅합니다.
const logConnectionEvent = (event: string, request: IncomingMessage, extra?: string) => {
  const address = request.socket.remoteAddress ?? "unknown";
  const suffix = extra ? ` - ${extra}` : "";
  logger.log(`${event} from ${address}${suffix}`.trim(), WEBSOCKET_SCOPE);
};

const sendInitConnectMessage = (socket: WebSocket) => {
  socket.send(
    serializeMessage({
      type: WebSocketPayloadType.CONNECTED,
      payload: { message: "Connected to Dalmuti Mobile WebSocket" },
    }),
  );

  // 새 소켓에 인증 키를 발급하고 챌린지를 전송.
  const authKey = webSocketAuthManager.issueKey(socket);
  socket.send(
    serializeMessage({
      type: WebSocketPayloadType.AUTH_CHALLENGE,
      payload: { authKey, ttlMs: AUTH_KEY_TTL_MS },
    }),
  );
}

// payload 객체에서 authKey 값을 추출합니다.
const extractAuthKey = (payload: WebSocketPayload): string | null => {
  if (!payload.payload || typeof payload.payload !== "object") {
    return null;
  }

  const { authKey } = payload.payload as Record<string, unknown>;
  return typeof authKey === "string" ? authKey : null;
};

// 인증 키를 제거한 나머지 payload 데이터를 반환합니다.
const stripAuthKey = (payload: WebSocketPayload): unknown => {
  if (!payload.payload || typeof payload.payload !== "object") {
    return payload.payload;
  }

  const { authKey, ...rest } = payload.payload as Record<string, unknown>;
  return rest;
};

// payload 내 인증 키를 확인하고 유효하지 않으면 에러를 전송합니다.
const requireValidAuthKey = (socket: WebSocket, payload: WebSocketPayload): string | null => {
  const authKey = extractAuthKey(payload);
  if (!authKey) {
    socket.send(serializeMessage({ type: WebSocketPayloadType.ERROR, message: "Missing authKey in payload" }));
    return null;
  }

  if (!webSocketAuthManager.refreshKey(authKey)) {
    socket.send(serializeMessage({ type: WebSocketPayloadType.ERROR, message: "Invalid or expired authKey" }));
    return null;
  }

  return authKey;
};
