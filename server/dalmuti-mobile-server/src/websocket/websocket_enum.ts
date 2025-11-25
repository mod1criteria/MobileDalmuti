// WebSocket 통신에 사용되는 표준 메시지 타입을 정의합니다.

export enum WebSocketPayloadType {
    // 네트워크 관련 메시지 타입
    NETWORK = "network",
    // 사용자 관련 메시지 타입
    USER = "user",
    // 방 관련 메시지 타입
    ROOM = "room",
    // 서버에서 에러 발생 시 전송하는 타입
    ERROR = "error",
    // 초기 연결 완료를 알리는 핸드셰이크 메시지
    CONNECTED = "connected",
    // 클라이언트가 서버 상태를 확인할 때 보내는 핑
    PING = "ping",
    // 핑 요청에 대한 응답으로 전달되는 퐁
    PONG = "pong",
    // 일반 메시지를 수신했음을 알리는 확인 응답
    ACK = "ack",
    // 서버가 인증 키를 발급하며 요구하는 챌린지
    AUTH_CHALLENGE = "auth_challenge",
    // 클라이언트가 인증 키를 검증해 달라고 보낼 때 사용
    AUTH_VERIFY = "auth_verify",
    // 인증이 성공적으로 완료되었음을 알리는 메시지
    AUTH_CONFIRMED = "auth_confirmed",
    // 사용자가 로그인할 때 보내는 메시지
    Login = "login",
    //  방 목록 요청 메시지
    GET_ROOM_LIST = "get_room_list",
    // 방 생성 요청 메시지
    CREATE_ROOM = "create_room",
}
