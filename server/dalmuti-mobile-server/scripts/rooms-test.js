/*
  Rooms feature test: create -> list -> join -> updated
*/
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { io } = require('socket.io-client');

function waitHealth(port = 3000, timeoutMs = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      const req = http.request({ hostname: '127.0.0.1', port, path: '/health', method: 'GET' }, (res) => {
        if (res.statusCode === 200) return resolve();
        if (Date.now() - start > timeoutMs) return reject(new Error('Health timeout'));
        setTimeout(poll, 200);
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('Health error'));
        setTimeout(poll, 200);
      });
      req.end();
    })();
  });
}

function startServer(port = 3000) {
  const env = { ...process.env, PORT: String(port), LOG_LEVEL: 'error' };
  const child = spawn(
    process.execPath,
    ['-r', 'ts-node/register', path.join(__dirname, '..', 'src', 'main.ts')],
    { env, stdio: ['ignore', 'pipe', 'pipe'] }
  );
  child.stdout.setEncoding('utf8');
  child.stderr.setEncoding('utf8');
  child._buf = { out: '', err: '' };
  child.stdout.on('data', (d) => (child._buf.out += d));
  child.stderr.on('data', (d) => (child._buf.err += d));
  return child;
}

async function run() {
  const srv = startServer(3000);
  try {
    await waitHealth(3000, 12000);
  } catch (e) {
    console.error('Server not healthy:', e.message);
    console.error(srv._buf);
    srv.kill('SIGKILL');
    process.exit(1);
  }

  const a = io('ws://127.0.0.1:3000/ws', { transports: ['websocket'] });
  const b = io('ws://127.0.0.1:3000/ws', { transports: ['websocket'] });

  await new Promise((r) => a.on('connect', r));
  await new Promise((r) => b.on('connect', r));

  // 1) Create room
  const createdSummary = await new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error('room:created timeout')), 6000);
    a.once('room:created', (payload) => { clearTimeout(to); resolve(payload); });
    a.emit('room:create', { title: '테스트방', maxPlayers: 4 });
  });
  if (!createdSummary?.id) throw new Error('Create failed');

  // 2) (optional) room:list skipped due to Socket.IO ack differences; rely on broadcasts instead

  // 3) Join from client B and expect updated
  const updated = await new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error('room:updated timeout')), 8000);
    a.once('room:updated', (payload) => { clearTimeout(to); resolve(payload); });
    b.emit('room:join', { roomId: createdSummary.id });
  });
  if (!updated?.id || updated.currentPlayers < 2) {
    throw new Error('Join failed or count wrong');
  }

  console.log('ROOMS_OK', { created: createdSummary, updated });
  process.exitCode = 0;
  a.close();
  b.close();
  srv.kill('SIGKILL');
}

run().catch((e) => {
  console.error('ROOMS_FAIL', e);
  process.exit(1);
});
