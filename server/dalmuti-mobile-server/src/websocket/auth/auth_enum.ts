export enum AuthMessageType {
    // 서버가 인증 키를 발급하며 요구하는 챌린지
    AUTH_CHALLENGE = "auth_challenge",
    // 클라이언트가 인증 키를 검증해 달라고 보낼 때 사용
    AUTH_VERIFY = "auth_verify",
    // 인증이 성공적으로 완료되었음을 알리는 메시지
    AUTH_CONFIRMED = "auth_confirmed",
}