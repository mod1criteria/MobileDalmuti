Dalmuti Mobile Server (NestJS)

개발용 최소 NestJS 서버 스캐폴드입니다. `npm install` 후 `npm run start`로 실행하면 `http://localhost:3000`에서 실행 확인 페이지를 볼 수 있습니다.

명령어

- 설치: `npm install`
- 실행: `npm run start`
- 개발(자동 재시작): `npm run start:dev`

엔드포인트

- `GET /` HTML 상태 페이지
- `GET /health` JSON 헬스체크 `{ status: "ok" }`

로그

- 애플리케이션 로그는 `logs/server.log`에 기록됩니다. (ANSI 색 제거됨)
- 날짜별 백업은 `logs/backup/server-YYYY-MM-DD.log.gz`로 압축 보관됩니다.
- 환경변수:
  - `LOG_LEVEL` (기본 `info`)
  - `LOG_MAX_FILES` (예: `14d`)

웹소켓

- 네임스페이스: `ws://localhost:3000/ws`
- 이벤트
  - `join` `{ roomId, nickname? }` → 같은 방 참가, 브로드캐스트 `system: { type: 'join' }`
  - `leave` `{ roomId }` → 방 퇴장, 브로드캐스트 `system: { type: 'leave' }`
  - `chat` `{ roomId, message }` → 방 내 브로드캐스트 `chat`

확장(Redis 어댑터)

- 멀티 인스턴스에서 룸/브로드캐스트를 동기화하려면 Redis 설정을 추가하세요.
- 환경변수 중 하나를 설정하면 자동 활성화됩니다.
  - `REDIS_URL=redis://localhost:6379`
  - 또는 `REDIS_HOST=127.0.0.1` + `REDIS_PORT=6379`