import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import Redis from 'ioredis';
import { GameGateway } from '../gateway/game.gateway';

@Injectable()
export class DiagnosticsService {
  private readonly logger = new Logger('Diagnostics');

  getInfo() {
    const mem = process.memoryUsage();
    return {
      status: 'ok',
      pid: process.pid,
      hostname: os.hostname(),
      node: process.version,
      uptimeSec: Math.round(process.uptime()),
      env: {
        nodeEnv: process.env.NODE_ENV || 'development',
        port: Number(process.env.PORT) || 3000,
        redisConfigured: Boolean(process.env.REDIS_URL || process.env.REDIS_HOST),
      },
      memory: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
        external: (mem as any).external,
      },
      time: new Date().toISOString(),
    };
  }

  async pingRedis() {
    const url = process.env.REDIS_URL || '';
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const port = Number(process.env.REDIS_PORT || 6379);
    const configured = Boolean(url || process.env.REDIS_HOST);
    if (!configured) return { configured, ok: false, error: 'not_configured' };
    let client: Redis | undefined;
    try {
      client = url
        ? new Redis(url, { lazyConnect: true, connectTimeout: 800 })
        : new Redis({ host, port, lazyConnect: true, connectTimeout: 800 });
      await client.connect();
      const res = await client.ping();
      await client.quit();
      return { configured, ok: res === 'PONG', reply: res };
    } catch (e: any) {
      this.logger.warn(`Redis ping failed: ${e?.message || e}`);
      try { await client?.quit(); } catch {}
      return { configured, ok: false, error: String(e?.message || e) };
    }
  }

  async wsStats(gateway?: GameGateway) {
    try {
      if (!gateway || !(gateway as any).server) {
        return { namespace: '/ws', info: 'gateway not available in this module context' };
      }
      const srv: any = (gateway as any).server as any;
      const namespace = srv?.name || '/ws';
      let clients = 0;
      if (typeof srv.fetchSockets === 'function') {
        const socks = await srv.fetchSockets();
        clients = socks.length;
      } else if (srv?.sockets && typeof srv.sockets.size === 'number') {
        clients = srv.sockets.size;
      }
      const roomsCount = srv?.adapter?.rooms ? srv.adapter.rooms.size : undefined;
      return { namespace, clients, rooms: roomsCount };
    } catch (e: any) {
      return { namespace: '/ws', error: String(e?.message || e) };
    }
  }

  writeLogs(level: 'debug'|'info'|'warn'|'error'|'verbose', message: string, context?: string) {
    const logger = new Logger(context || 'Diagnostics');
    switch (level) {
      case 'debug':
        logger.debug(message);
        break;
      case 'warn':
        logger.warn(message);
        break;
      case 'error':
        logger.error(message);
        break;
      case 'verbose':
        logger.verbose(message);
        break;
      default:
        logger.log(message);
    }
    return { ok: true };
  }

  readLogTail(lines: number = 200) {
    const maxLines = Math.min(Math.max(lines, 1), 1000);
    const file = path.resolve(process.cwd(), 'logs', 'server.log');
    try {
      if (!fs.existsSync(file)) return { exists: false, content: '' };
      const data = fs.readFileSync(file, 'utf8');
      const arr = data.split(/\r?\n/);
      const tail = arr.slice(-maxLines).join('\n');
      return { exists: true, lines: Math.min(maxLines, arr.length), content: tail };
    } catch (e: any) {
      return { exists: false, error: String(e?.message || e) };
    }
  }
}
