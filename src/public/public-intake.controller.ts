import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common'; // PHASE 6 CHANGE
import { Throttle } from '@nestjs/throttler'; // PHASE 6 CHANGE
import { ApiKeyGuard } from '../api-keys/api-key.guard'; // PHASE 6 CHANGE
import { RightsRequestsService } from '../rights-requests/rights-requests.service'; // PHASE 6 CHANGE
import { PublicRightsRequestDto } from './dto/public-rights-request.dto'; // PHASE 6 CHANGE

@Controller('api/v1/public') // PHASE 6 CHANGE
export class PublicIntakeController {
  constructor(
    private readonly rightsRequestsService: RightsRequestsService, // PHASE 6 CHANGE
  ) {}

  // POST /api/v1/public/rights/submit
  // Headers required: x-api-key, x-tenant-id
  // rate limit: 20 requests per 60 seconds (60000 ms) per IP
  @Post('rights/submit') // PHASE 6 CHANGE
  @UseGuards(ApiKeyGuard) // PHASE 6 CHANGE
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // PHASE 6 CHANGE
  async submitRequest(
    @Body() dto: PublicRightsRequestDto, // PHASE 6 CHANGE
    @Request() req: any, // PHASE 6 CHANGE
  ) {
    const tenantId = req.tenantId; // PHASE 6 CHANGE
    const createDto = {
      ...dto,
      tenantId,
      submissionChannel: dto.submissionChannel || 'WEB',
    };
    // Call rights service, marking creator as the API key integration
    return this.rightsRequestsService.create(createDto as any, `API_KEY_${tenantId}`); // PHASE 6 CHANGE
  }
}
