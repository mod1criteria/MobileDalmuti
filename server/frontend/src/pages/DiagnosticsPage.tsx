import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

type Json = any;

export default function DiagnosticsPage() {
  const [info, setInfo] = useState<Json>(null);
  const [redis, setRedis] = useState<Json>(null);
  const [ws, setWs] = useState<Json>(null);
  const [log, setLog] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [autoSec, setAutoSec] = useState<number>(0);
  const [lines, setLines] = useState<number>(200);

  const fmt = useCallback((o: any) => (typeof o === 'string' ? o : JSON.stringify(o, null, 2)), []);

  const refreshAll = useCallback(async () => {
    const started = Date.now();
    try {
      const [infoRes, redisRes, wsRes, logRes] = await Promise.all([
        api.get('/diag'),
        api.get('/diag/redis').catch((e) => ({ data: { ok: false, error: String(e) } } as any)),
        api.get('/diag/ws').catch((e) => ({ data: { error: String(e) } } as any)),
        api
          .get(`/diag/logs`, { params: { lines: Number.isFinite(lines) ? lines : 200 }, responseType: 'text' })
          .catch(() => ({ data: '' } as any)),
      ]);
      setInfo(infoRes.data);
      setRedis(redisRes.data);
      setWs(wsRes.data);
      setLog(typeof logRes.data === 'string' ? logRes.data : String(logRes.data));
      setStatus(`업데이트: ${new Date().toLocaleTimeString()} (${Date.now() - started}ms)`);
    } catch (e: any) {
      setStatus(`오류: ${e?.message || String(e)}`);
    }
  }, [lines]);

  const reloadLog = useCallback(async () => {
    const res = await api.get('/diag/logs', { params: { lines: Number.isFinite(lines) ? lines : 200 }, responseType: 'text' });
    setLog(res.data);
  }, [lines]);

  useEffect(() => {
    let timer: number | null = null;
    refreshAll();
    if (autoSec > 0) {
      timer = window.setInterval(refreshAll, autoSec * 1000);
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [autoSec, refreshAll]);

  const containerStyle = useMemo(
    () => ({ background: '#0f172a', color: '#e5e7eb', minHeight: '100vh', margin: 0, fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans KR, Arial' }),
    []
  );

  return (
    <div style={containerStyle as any}>
      <header style={{ padding: '16px 20px', background: '#111827', borderBottom: '1px solid #1f2937' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>서버 진단 정보</h1>
          <span style={{ marginLeft: 'auto', opacity: 0.8 }}>{status}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button onClick={refreshAll} style={btnStyle}>새로고침</button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            자동 새로고침
            <select value={String(autoSec)} onChange={(e) => setAutoSec(Number(e.target.value))} style={btnStyle as any}>
              <option value="0">끄기</option>
              <option value="5">5초</option>
              <option value="10">10초</option>
              <option value="30">30초</option>
            </select>
          </label>
          <a href="/api/health" target="_blank" rel="noreferrer" style={linkStyle}>
            /api/health
          </a>
          <a href="/api/diag/redis" target="_blank" rel="noreferrer" style={linkStyle}>
            /api/diag/redis
          </a>
          <a href="/api/diag/ws" target="_blank" rel="noreferrer" style={linkStyle}>
            /api/diag/ws
          </a>
          <a href="/api/diag" target="_blank" rel="noreferrer" style={linkStyle}>
            /api/diag
          </a>
        </div>
      </header>

      <main
        style={{
          padding: '16px 20px',
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        }}
      >
        <section style={cardStyle}>
          <h2 style={h2Style}>서비스 정보</h2>
          <pre style={preStyle}>{fmt(info ?? '...')}</pre>
        </section>
        <section style={cardStyle}>
          <h2 style={h2Style}>Redis 상태</h2>
          <pre style={preStyle}>{fmt(redis ?? '...')}</pre>
        </section>
        <section style={cardStyle}>
          <h2 style={h2Style}>WebSocket 연결</h2>
          <pre style={preStyle}>{fmt(ws ?? '...')}</pre>
        </section>
        <section style={cardStyle}>
          <h2 style={h2Style}>최근 로그</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <label>
              라인 수
              <input
                type="number"
                min={50}
                max={1000}
                value={lines}
                onChange={(e) => setLines(Number(e.target.value))}
                style={{
                  width: 80,
                  background: '#0b1220',
                  color: '#e5e7eb',
                  border: '1px solid #374151',
                  borderRadius: 6,
                  padding: '4px 6px',
                  marginLeft: 8,
                }}
              />
            </label>
            <button onClick={reloadLog} style={btnStyle}>로그 새로고침</button>
          </div>
          <pre style={{ ...preStyle, maxHeight: 320 }}>{log}</pre>
        </section>
      </main>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: '#1f2937',
  color: '#e5e7eb',
  border: '1px solid #374151',
  borderRadius: 8,
  padding: '6px 10px',
  cursor: 'pointer',
};

const linkStyle: React.CSSProperties = { color: '#93c5fd', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };
const cardStyle: React.CSSProperties = { background: '#111827', border: '1px solid #1f2937', borderRadius: 10, padding: '12px 14px' };
const h2Style: React.CSSProperties = { margin: '6px 0 10px', fontSize: 18 };
const preStyle: React.CSSProperties = { whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#0b1220', borderRadius: 8, padding: 8, overflow: 'auto' };

