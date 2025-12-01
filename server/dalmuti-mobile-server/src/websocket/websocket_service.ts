import { Server as HttpServer } from "http";
import { IncomingMessage } from "http";
import { WebSocketServer, WebSocket, RawData } from "ws";
import { logger } from "../logger";
import { webSocketAuthManager, AUTH_KEY_TTL_MS } from "./module/auth/auth_manager";
import { Msg } from "./msg/msg_type";
import { userManager } from "./module/user/user_manager";
import { sendError, sendMsg } from "./msg/msg_builder";
import { ErrorCode } from "./dalmuti_error";


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
        sendError(socket, ErrorCode.INVALID_PAYLOAD_FORMAT);
        return;
      }
      // 인증 키를 제외한 나머지 페이로드 데이터를 준비.
      const sanitizedPayload = stripAuthKey(payload);
      logger.log(`Received message: ${payload.type}`);


      // 핑 요청에 대해 퐁 응답을 전송.
      if (payload.type === "network") {
        if (payload.subtype === "ping") {
          sendMsg(socket, { type: "network", subtype: "pong", payload: sanitizedPayload as any });
          return;
        }
      }

      // 인증 키를 확인하고 유효하지 않으면 처리 중단.
      const authKey = requireValidAuthKey(socket, payload);
      if (!authKey) {
        return;
      }

      // 인증 검증 요청에 대해 인증 확인 응답을 전송.
      if (payload.type === "auth") {
        if (payload.subtype === "auth_verify") {
          sendMsg(socket, { type: "auth", subtype: "auth_confirmed", payload: { success: true } });
        }
        if (payload.subtype === "login") {
          userManager.addUser(authKey, (sanitizedPayload as any).username, socket);
          logger.log(`User logged in with athKey: ${authKey}`);
        }
        return;
      }
      
      // 기타 모든 메시지에 대해 확인 응답(ACK)을 전송.
      sendMsg(socket, { type: "network", subtype: "ack", payload });
    });

    socket.on("close", (code: number, reason: Buffer) => {
      // 소켓과 연결된 인증 키를 모두 회수합니다.
      let authKey = webSocketAuthManager.extractAuthKeyBySocket(socket)
      userManager.removeUser(authKey);
      webSocketAuthManager.revokeKeyBySocket(socket);
      logger.log(
        `Client disconnected (code=${code}, reason=${reason.toString() || "n/a"})`,
      );
    });

    socket.on("error", (error: Error) => {
      logger.error(`WebSocket error: ${error.message}`, error.stack);
    });
  });

  return { wss };
};


// 수신된 원시 데이터를 WebSocketPayload 형태로 파싱합니다.
const parseIncomingMessage = (data: RawData): Msg | null => {
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

// 접속 이벤트를 클라이언트 IP와 함께 로깅합니다.
const logConnectionEvent = (event: string, request: IncomingMessage, extra?: string) => {
  const address = request.socket.remoteAddress ?? "unknown";
  const suffix = extra ? ` - ${extra}` : "";
  logger.log(`${event} from ${address}${suffix}`.trim());
};

const sendInitConnectMessage = (socket: WebSocket) => {
  // 환영 메시지 전송.
  sendMsg(socket, { type: "network", subtype: "connected", payload: { message: "Connected to Dalmuti Mobile WebSocket" } });

  // 새 소켓에 인증 키를 발급하고 챌린지를 전송.
  const authKey = webSocketAuthManager.issueKey(socket);
  sendMsg(socket, {type: "auth", subtype: "auth_challenge", authKey, payload: { ttlMs: AUTH_KEY_TTL_MS } });
}

// payload 객체에서 authKey 값을 추출합니다.
const extractAuthKey = (payload: Msg): string | null => {
  if ("authKey" in payload && typeof payload.authKey === "string") {
    return payload.authKey;
  }
  return null;
};

// 인증 키를 제거한 나머지 payload 데이터를 반환합니다.
const stripAuthKey = (msg: Msg): unknown => {
  if ("payload" in msg && typeof msg.payload === "object") {
    return msg.payload;
  }
  return {};
};

// payload 내 인증 키를 확인하고 유효하지 않으면 에러를 전송합니다.
const requireValidAuthKey = (socket: WebSocket, payload: Msg): string | null => {
  
  const authKey = extractAuthKey(payload);
  if (!authKey) {
    sendError(socket, ErrorCode.MISSING_AUTH_KEY);
    return null;
  }

  if (!webSocketAuthManager.refreshKey(authKey)) {
    sendError(socket, ErrorCode.INVALID_OR_EXPIRED_AUTH_KEY);
    return null;
  }

  return authKey;
};
