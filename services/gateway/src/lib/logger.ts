import pino from 'pino';
import { env } from './env';

export function createLogger() {
  return pino({
    level: env.LOG_LEVEL,
    formatters: {
      level: (label) => ({ level: label }),
      log: (object) => ({
        ...object,
        service: 'gateway',
        devId: env.DEV_ID,
        timestamp: new Date().toISOString()
      })
    },
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        correlationId: req.headers['x-corr-id']
      }),
      res: (res) => ({
        statusCode: res.statusCode
      }),
      err: pino.stdSerializers.err
    },
    ...(env.NODE_ENV === 'development' && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'hostname,pid'
        }
      }
    })
  });
}
