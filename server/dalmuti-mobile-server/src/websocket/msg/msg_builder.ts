import { logger } from "../../logger";
import { ErrorCode, ErrorMessageMap } from "../dalmuti_error";
import { MsgSchema } from "./msg_schema";
import { MessageOf, Msg, MsgSubType, MsgType } from "./msg_type";
import { WebSocket } from "ws";

function createMessageBuilder<C extends MsgType>(type: C) {
    return function <S extends MsgSubType<C>>(
      subtype: S,
    ) {
      return (data: MsgSchema[C][S]): MessageOf<C, S> => ({
        type,
        subtype,
        ...(data as any),
      });
    };
  }

const networkBuilder = createMessageBuilder("network");
const authBuilder = createMessageBuilder("auth");
const roomBuilder = createMessageBuilder("room");
const errorBuilder = createMessageBuilder("error");

export const msgBuilders = {
    network: {
      connected: networkBuilder("connected"),
      ping: networkBuilder("ping"),
      pong: networkBuilder("pong"),
      ack: networkBuilder("ack"),
    },
    auth: {
      auth_challenge: authBuilder("auth_challenge"),
      auth_verify: authBuilder("auth_verify"),
      auth_confirmed: authBuilder("auth_confirmed"),
      login: authBuilder("login"),
    },
    room: {
      req_room_list: roomBuilder("req_room_list"),
      req_create_room: roomBuilder("req_create_room"),
      res_room_list: roomBuilder("res_room_list"),
      res_create_room: roomBuilder("res_create_room"),
    },
    error: {
      generic_error: errorBuilder("generic_error"),
    },
  };

export function sendMsg<
  C extends MsgType,
  S extends MsgSubType<C>
>(socket: WebSocket, message: MessageOf<C, S>): void {
  socket.send(serializeMessage(message));
}

export function serializeMessage<
  C extends MsgType,
  S extends MsgSubType<C>
>(message: MessageOf<C, S>): string;


export function serializeMessage(message: Msg): string {
    try {
      return JSON.stringify(message);
    } catch (error) {
      // 직렬화 실패 시, 로깅
      logger.error(
        `Failed to serialize WebSocket message: ${(error as Error).message}`,
        (error as Error).stack
      );
  
      // fallback: 항상 유효한 error 메시지 하나 만들어서 보냄
      const fallback: Msg = {
        type: "error",
        subtype: "generic_error",
        code: "SERIALIZATION_FAILURE",
        message: "Failed to serialize WebSocket message",
        details: {
          originalMessageType: (message as any)?.type,
          originalMessageSubType: (message as any)?.subtype,
        },
      };
  
      return JSON.stringify(fallback);
    }
  }

  export function buildErrorMessage(
    code: ErrorCode,
    details?: unknown,
    overrideMessage?: string,
  ): MessageOf<"error", "generic_error"> {
    const message = overrideMessage ?? ErrorMessageMap[code] ?? "Unknown error";
  
    return msgBuilders.error.generic_error({
      code,
      message,
      ...(details === undefined ? {} : { details }),
    });
  }

  export function sendError(
    socket: WebSocket,
    code: ErrorCode,
    details?: unknown,
    overrideMessage?: string,
  ): void {
    const msg = buildErrorMessage(code, details, overrideMessage);
    sendMsg(socket, msg);
  }