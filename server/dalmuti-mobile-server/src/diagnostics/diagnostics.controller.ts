import { Body, Controller, Get, Header, Post, Query } from '@nestjs/common';
import { DiagnosticsService } from './diagnostics.service';

@Controller('diag')
export class DiagnosticsController {
  constructor(private readonly svc: DiagnosticsService) {}

  @Get()
  root() {
    return this.svc.getInfo();
  }

  @Get('redis')
  redis() {
    return this.svc.pingRedis();
  }

  @Get('ws')
  ws() { return this.svc.wsStats(); }

  @Get('echo')
  echo(@Query('msg') msg?: string) {
    return { msg: msg || '' };
  }

  @Post('log')
  log(@Body() body: { level?: string; message?: string; context?: string }) {
    const level = (body.level || 'info') as any;
    const message = body.message || 'test log';
    const context = body.context || 'DiagHTTP';
    return this.svc.writeLogs(level, message, context);
  }

  @Get('logs')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  logs(@Query('lines') lines?: string) {
    const n = lines ? parseInt(lines, 10) : 200;
    const { content = '', error } = this.svc.readLogTail(Number.isFinite(n) ? n : 200) as any;
    return error ? String(error) : content;
  }

  @Get('ui')
  @Header('Content-Type', 'text/html; charset=utf-8')
  ui() {
    return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Diagnostics</title>
    <style>
      :root { color-scheme: dark light; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Noto Sans KR", Arial; background:#0f172a; color:#e5e7eb; }
      header { padding: 16px 20px; background:#111827; border-bottom:1px solid #1f2937; }
      main { padding: 16px 20px; display:grid; gap:16px; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
      .card { background:#111827; border:1px solid #1f2937; border-radius:10px; padding:12px 14px; }
      h2 { margin:6px 0 10px; font-size:18px; }
      .row { display:flex; gap:8px; align-items:center; }
      button, select { background:#1f2937; color:#e5e7eb; border:1px solid #374151; border-radius:8px; padding:6px 10px; cursor:pointer; }
      pre, code { white-space:pre-wrap; word-break:break-word; background:#0b1220; border-radius:8px; padding:8px; overflow:auto; max-height:320px; }
      a { color:#93c5fd; text-decoration:none; }
      a:hover { text-decoration:underline; }
    </style>
  </head>
  <body>
    <header>
      <div class="row">
        <h1 style="margin:0; font-size:20px;">서버 진단 대시보드</h1>
        <span id="status" style="margin-left:auto; opacity:0.8;"></span>
      </div>
      <div class="row" style="margin-top:8px; gap:10px;">
        <button id="refresh">새로고침</button>
        <label>자동 새로고침
          <select id="auto">
            <option value="0">끄기</option>
            <option value="5">5초</option>
            <option value="10">10초</option>
            <option value="30">30초</option>
          </select>
        </label>
        <a href="/health" target="_blank">/health</a>
        <a href="/diag/redis" target="_blank">/diag/redis</a>
        <a href="/diag/ws" target="_blank">/diag/ws</a>
        <a href="/diag" target="_blank">/diag</a>
      </div>
    </header>
    <main>
      <section class="card"><h2>인스턴스 정보</h2><pre id="info">...</pre></section>
      <section class="card"><h2>Redis 상태</h2><pre id="redis">...</pre></section>
      <section class="card"><h2>WebSocket 통계</h2><pre id="ws">...</pre></section>
      <section class="card"><h2>최근 로그</h2>
        <div class="row" style="margin-bottom:8px;">
          <label>라인 수 <input id="lines" type="number" min="50" max="1000" value="200" style="width:80px;background:#0b1220;color:#e5e7eb;border:1px solid #374151;border-radius:6px;padding:4px 6px;"/></label>
          <button id="reloadLog">로그 새로고침</button>
        </div>
        <pre id="log">...</pre>
      </section>
    </main>
    <script>
      const $ = (id) => document.getElementById(id);
      const fmt = (o) => typeof o === 'string' ? o : JSON.stringify(o, null, 2);
      async function fetchJson(url) {
        const r = await fetch(url);
        return r.json();
      }
      async function fetchText(url) {
        const r = await fetch(url);
        return r.text();
      }
      async function refreshAll() {
        const started = Date.now();
        try {
          const [info, redis, ws, log] = await Promise.all([
            fetchJson('/diag'),
            fetchJson('/diag/redis').catch(e => ({ ok:false, error:String(e) })),
            fetchJson('/diag/ws').catch(e => ({ error:String(e) })),
            fetchText('/diag/logs?lines=' + (Number($('#lines').value)||200)).catch(()=>'')
          ]);
          $('#info').textContent = fmt(info);
          $('#redis').textContent = fmt(redis);
          $('#ws').textContent = fmt(ws);
          $('#log').textContent = log || '';
          $('#status').textContent = '업데이트: ' + new Date().toLocaleTimeString() + ' (' + (Date.now()-started) + 'ms)';
        } catch (e) {
          $('#status').textContent = '오류: ' + e;
        }
      }
      let timer = null;
      $('#refresh').onclick = refreshAll;
      $('#reloadLog').onclick = async () => {
        $('#log').textContent = await fetchText('/diag/logs?lines=' + (Number($('#lines').value)||200));
      };
      $('#auto').onchange = () => {
        if (timer) { clearInterval(timer); timer = null; }
        const sec = Number($('#auto').value);
        if (sec > 0) timer = setInterval(refreshAll, sec*1000);
      };
      refreshAll();
    </script>
  </body>
</html>`;
  }
}
