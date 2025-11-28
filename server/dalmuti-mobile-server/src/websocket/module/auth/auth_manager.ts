import { randomBytes } from "crypto";
import { WebSocket } from "ws";
import { logger } from "../../../logger";

const KEY_TTL_MS = 60_000; // one minute
export const AUTH_KEY_TTL_MS = KEY_TTL_MS;
const AUTH_SCOPE = "WebSocketAuth";

export type AuthKeyRecord = {
  key: string;
  socket: WebSocket;
  timer: NodeJS.Timeout;
  lastTouched: number;
};

// 16바이트 난수를 16진 문자열로 변환해 임시 인증 키를 생성합니다.
const generateKey = () => randomBytes(16).toString("hex");

// WebSocket 인증 키를 발급하고 수명/회수를 관리하는 매니저입니다.
export class WebSocketAuthManager {
  private readonly records = new Map<string, AuthKeyRecord>();

  // 새 WebSocket 연결에 인증 키를 발급하고 만료 타이머를 설정합니다.
  public issueKey(socket: WebSocket) {
    const key = generateKey();
    const record: AuthKeyRecord = {
      key,
      socket,
      timer: this.createExpiryTimer(key),
      lastTouched: Date.now(),
    };

    this.records.set(key, record);
    logger.log(`Issued authentication key for socket (total=${this.records.size})`, AUTH_SCOPE);
    return key;
  }

  // 소켓과 연결된 인증 키를 찾아 반환합니다.
  public extractAuthKeyBySocket(socket: WebSocket): string {
    for (const [key, record] of this.records) {
      if (record.socket === socket) {
        return key;
      }
    }
    return "";
  }

  // 인증 키를 갱신하여 만료 타이머를 초기화하고 활성 상태를 유지합니다.
  public refreshKey(key: string) {
    const record = this.records.get(key);
    if (!record) {
      return false;
    }

    clearTimeout(record.timer);
    record.lastTouched = Date.now();
    record.timer = this.createExpiryTimer(key);
    return true;
  }

  // 소켓과 연결된 모든 인증 키를 찾아 회수합니다.
  public revokeKeyBySocket(socket: WebSocket) {
    for (const [key, record] of this.records) {
      if (record.socket === socket) {
        this.revokeKey(key);
      }
    }
  }

  // 지정한 인증 키를 즉시 회수하고 매핑에서 제거합니다.
  private revokeKey(key: string) {
    const record = this.records.get(key);
    if (!record) {
      return false;
    }

    clearTimeout(record.timer);
    this.records.delete(key);
    logger.log(`Revoked authentication key (total=${this.records.size})`, AUTH_SCOPE);
    return true;
  }

  // 키가 사용되지 않으면 TTL 이후 자동으로 만료시키는 타이머를 생성합니다.
  private createExpiryTimer(key: string) {
    return setTimeout(() => {
      if (this.records.delete(key)) {
        logger.log(`Authentication key expired after inactivity (key=${key}, total=${this.records.size})`, AUTH_SCOPE);
      }
    }, KEY_TTL_MS);
  }
}

export const webSocketAuthManager = new WebSocketAuthManager();