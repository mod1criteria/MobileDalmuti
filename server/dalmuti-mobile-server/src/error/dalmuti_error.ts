export enum ErrorCode {
    SERIALIZATION_FAILURE = "SERIALIZATION_FAILURE",
    INVALID_PAYLOAD_FORMAT = "INVALID_PAYLOAD_FORMAT",
    MISSING_AUTH_KEY = "MISSING_AUTH_KEY",
    INVALID_OR_EXPIRED_AUTH_KEY = "INVALID_OR_EXPIRED_AUTH_KEY",
}


export const ErrorMessageMap: Record<ErrorCode, string> = {
    [ErrorCode.INVALID_PAYLOAD_FORMAT]: "Invalid payload format",
    [ErrorCode.MISSING_AUTH_KEY]: "Missing authKey in payload",
    [ErrorCode.INVALID_OR_EXPIRED_AUTH_KEY]: "Invalid or expired authKey",
    [ErrorCode.SERIALIZATION_FAILURE]: "Failed to serialize WebSocket message"
};