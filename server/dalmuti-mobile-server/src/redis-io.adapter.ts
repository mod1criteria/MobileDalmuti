import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor?: ReturnType<typeof createAdapter>;

  constructor(private app: INestApplication) {
    super(app);
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      transports: ['websocket'],
      cors: { origin: '*', methods: ['GET', 'POST'] },
      ...(options || {}),
    } as ServerOptions);

    const url = process.env.REDIS_URL || '';
    const host = process.env.REDIS_HOST || '127.0.0.1';
    const portNum = Number(process.env.REDIS_PORT || 6379);

    try {
      const pubClient = url ? new Redis(url) : new Redis({ host, port: portNum });
      const subClient = pubClient.duplicate();
      this.adapterConstructor = createAdapter(pubClient, subClient);
      // @ts-ignore socket.io server typing
      server.adapter(this.adapterConstructor);
      // eslint-disable-next-line no-console
      console.info('[RedisIoAdapter] Redis adapter attached');
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[RedisIoAdapter] Failed to configure Redis, falling back to in-memory', e);
    }

    return server;
  }
}

