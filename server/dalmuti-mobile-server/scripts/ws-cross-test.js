/*
  Cross-instance Socket.IO + Redis adapter test.
  Spawns two server instances on :3000 and :3001 with REDIS_URL, joins same room from
  two clients connected to different instances, and verifies cross-broadcast.
*/
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { io } = require('socket.io-client');

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

function waitHealth(port, timeoutMs = 10000) {
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

function startServer(port) {
  const env = { ...process.env, PORT: String(port), REDIS_URL, LOG_LEVEL: 'error' };
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
  const s1 = startServer(3000);
  const s2 = startServer(3001);
  try {
    await Promise.all([waitHealth(3000), waitHealth(3001)]);
  } catch (e) {
    console.error('Servers failed to become healthy:', e.message);
    console.error('--- S1 OUT ---\n' + (s1._buf?.out || ''));
    console.error('--- S1 ERR ---\n' + (s1._buf?.err || ''));
    console.error('--- S2 OUT ---\n' + (s2._buf?.out || ''));
    console.error('--- S2 ERR ---\n' + (s2._buf?.err || ''));
    s1.kill('SIGKILL');
    s2.kill('SIGKILL');
    process.exit(1);
  }

  const a = io('ws://127.0.0.1:3000/ws', { transports: ['websocket'] });
  const b = io('ws://127.0.0.1:3001/ws', { transports: ['websocket'] });

  const roomId = 'r1';

  const got = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No cross-instance message')), 8000);
    a.on('chat', (payload) => {
      clearTimeout(timer);
      resolve(payload);
    });
  });

  await new Promise((r) => a.on('connect', r));
  await new Promise((r) => b.on('connect', r));

  a.emit('join', { roomId });
  b.emit('join', { roomId });

  // give some time for room join to propagate via Redis
  await new Promise((r) => setTimeout(r, 500));
  b.emit('chat', { roomId, message: 'hello-redis' });

  try {
    const payload = await got;
    console.log('CROSS_OK', payload);
    process.exitCode = 0;
  } catch (e) {
    console.error('CROSS_FAIL', e.message);
    process.exitCode = 1;
  } finally {
    a.close();
    b.close();
    s1.kill('SIGKILL');
    s2.kill('SIGKILL');
  }
}

run().catch((e) => {
  console.error('UNEXPECTED', e);
  process.exit(1);
});
