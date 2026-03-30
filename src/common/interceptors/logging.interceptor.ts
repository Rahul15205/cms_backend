import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Logger } from 'nestjs-pino';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const userId = request.user?.id || 'anonymous';
    
    this.logger.log(
      { req: { method, url: originalUrl, ip, userAgent, userId } },
      `Incoming Request: ${method} ${originalUrl}`,
    );

    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        const { statusCode } = response;
        const duration = Date.now() - now;
        
        this.logger.log(
          { res: { statusCode, duration } },
          `Outgoing Response: ${method} ${originalUrl} ${statusCode} - ${duration}ms`,
        );
      }),
    );
  }
}
