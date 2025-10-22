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
