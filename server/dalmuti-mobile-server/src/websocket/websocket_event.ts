import { EventEmitter } from "events";
import { WebSocket } from "ws";
import { Msg } from "../msg/msg_type";

export type WebSocketEvent = {
  socket: WebSocket;
  authKey?: string;
  type: Msg["type"];
  subtype: string;
  payload: object;
};

export const websocketEventBus = new EventEmitter();

export const toWebSocketEventKey = (type: string, subtype?: string) => `${type}:${subtype ?? ""}`;