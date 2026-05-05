import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable, ExecutionContext } from '@nestjs/common';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Return the real IP behind proxy (Nginx/Cloudflare)
    return req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip;
  }

  async handleRequest(requestProps: any): Promise<boolean> {
    const { context } = requestProps;
    const request = context.switchToHttp().getRequest();
    const userAgent = request.headers['user-agent'] || '';

    // Bypass throttling for our internal scanner
    if (userAgent.includes('Proteccio-Scanner/1.1')) {
      return true;
    }

    return super.handleRequest(requestProps);
  }
}
