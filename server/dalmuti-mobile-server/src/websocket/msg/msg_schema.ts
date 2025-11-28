

// type 별 subtype + payload 스키마 정의
export interface MsgSchema {
    network: {
        connected: {
            // 서버 → 클라이언트: 연결 완료 알림
            payload: {
                message: string;
            }
        };
        ping: {
            // 클라이언트 → 서버
            payload: {
                timestamp: number; // YYYYMMDDHHmmssSSS
            }
        };
        pong: {
            // 서버 → 클라이언트
            payload: {
                timestamp: number; // YYYYMMDDHHmmssSSS
            }
        };
        ack: {
            // 서버 → 클라이언트: 메시지 수신 확인
            payload: {
                
            }
        };
    };
    auth: {
        auth_challenge: {
            authKey: string;
            payload: {
                ttlMs: number;
            };
        };
        auth_verify: {
            authKey: string;
        };
        auth_confirmed: {
            payload: {
                success: boolean;
            };
        };
        login: {
            authKey: string;
            payload: {
                username: string;
            };
        };
    }
    room: {
        req_room_list: {
            // 클라 → 서버: 요청은 필드가 없을 수도 있으니 빈 객체 허용
            authKey: string;
            payload: {
                page: number;
                pageSize ?: number; // default 8
            }
        };
        req_create_room: {
            // 클라 → 서버: 방 생성
            name: string;
            maxPlayers: number;
        };
        // 예시: 방 리스트 응답
        res_room_list: {
            //서버 → 클라: 방 리스트 응답
            rooms: Array<{
                id: string;
                name: string;
                currentPlayers: number;
                maxPlayers: number;
            }>;
        };
        res_create_room: {
            //서버 → 클라: 방 생성 응답
            roomId: string;
            name: string;
            maxPlayers: number;
            success: boolean;
        }
    };
    error: {
        generic_error: {
            code: string;     // ex) "INVALID_PAYLOAD", "UNAUTHORIZED"
            message: string;  // 사용자에게 보여줄 수 있는 에러 메시지
            details ?: unknown; // 추가 디버깅 정보
        };
    };
};

