import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getIndexHtml(): string {
    return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dalmuti Server</title>
    <style>
      html, body { height: 100%; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', Arial, 'Apple SD Gothic Neo', sans-serif; }
      .wrap { display: grid; place-items: center; height: 100%; background: #0f172a; color: #e2e8f0; }
      .card { text-align: center; padding: 32px 40px; border-radius: 12px; background: #111827; box-shadow: 0 6px 24px rgba(0,0,0,0.35); }
      h1 { margin: 0 0 8px; font-size: 28px; }
      p { margin: 4px 0; color: #9ca3af; }
      code { background: #0b1220; padding: 2px 6px; border-radius: 6px; color: #93c5fd; }
      a { color: #93c5fd; text-decoration: none; }
      a:hover { text-decoration: underline; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>Dalmuti NestJS Server</h1>
        <p>서버가 정상적으로 실행 중입니다.</p>
        <p>엔드포인트: <code>GET /</code>, <code>GET /health</code></p>
        <p>상태 확인: <a href="/health">/health</a></p>
      </div>
    </div>
  </body>
 </html>`;
  }
}

