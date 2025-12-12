import { MsgSchema } from "./msg_schema";

export type MsgType = keyof MsgSchema;

export type MsgSubType<C extends MsgType> = keyof MsgSchema[C];

export type MessageBase<
  C extends MsgType,
  S extends MsgSubType<C>
> = {
  type: C;
  subtype: S;
};

export type MessageOf<
  C extends MsgType,
  S extends MsgSubType<C>
> = MessageBase<C, S> & MsgSchema[C][S & keyof MsgSchema[C]];

export type Msg = {
    [C in MsgType]: {
        [S in keyof MsgSchema[C]]: MessageOf<C, S>;
    }[keyof MsgSchema[C]];
}[MsgType];