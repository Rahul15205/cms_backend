import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Delete,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { CookiesManagementService } from './cookies-management.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCookieCategoryDto } from './dto/create-cookie-category.dto';
import { CreateCookieInventoryDto } from './dto/create-cookie-inventory.dto';
import { CreateScannedWebsiteDto } from './dto/create-scanned-website.dto';
import { CreateCookieBannerDto } from './dto/create-cookie-banner.dto';
import { CreateCookieConsentLogDto } from './dto/create-cookie-consent-log.dto';

@Controller('api/v1/cookies')
@UseGuards(JwtAuthGuard)
export class CookiesManagementController {
  constructor(private readonly cookiesManagementService: CookiesManagementService) {}

  // ---------------------------------------------------------
  // Cookie Categories
  // ---------------------------------------------------------

  @Post('categories')
  createCategory(@Body() dto: CreateCookieCategoryDto, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.createCategory(dto, tenantId);
  }

  @Get('categories')
  getCategories(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.getCategories(tenantId);
  }

  @Put('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCookieCategoryDto>,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.updateCategory(id, dto, tenantId);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.deleteCategory(id, tenantId);
  }

  // ---------------------------------------------------------
  // Cookie Inventory
  // ---------------------------------------------------------

  @Post('inventory')
  createCookie(@Body() dto: CreateCookieInventoryDto, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.createCookie(dto, tenantId);
  }

  @Get('inventory')
  getInventory(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.getInventory(tenantId);
  }

  @Put('inventory/:id')
  updateCookie(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCookieInventoryDto>,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.updateCookie(id, dto, tenantId);
  }

  @Delete('inventory/:id')
  deleteCookie(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.deleteCookie(id, tenantId);
  }

  // ---------------------------------------------------------
  // Website Scanner (Phase 2)
  // ---------------------------------------------------------

  @Post('websites')
  createWebsite(@Body() dto: CreateScannedWebsiteDto, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.createWebsite(dto, tenantId);
  }

  @Get('websites')
  getWebsites(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.getWebsites(tenantId);
  }

  @Put('websites/:id')
  updateWebsite(
    @Param('id') id: string,
    @Body() dto: Partial<CreateScannedWebsiteDto>,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.updateWebsite(id, dto, tenantId);
  }

  @Delete('websites/:id')
  deleteWebsite(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.deleteWebsite(id, tenantId);
  }

  @Post('scan/:id')
  startScan(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.startScan(id, tenantId);
  }

  // ---------------------------------------------------------
  // Cookie Banners (Phase 3)
  // ---------------------------------------------------------

  @Post('banners')
  createBanner(@Body() dto: CreateCookieBannerDto, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.createBanner(dto, tenantId);
  }

  @Get('banners')
  getBanners(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.getBanners(tenantId);
  }

  @Put('banners/:id')
  updateBanner(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCookieBannerDto>,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.updateBanner(id, dto, tenantId);
  }

  @Delete('banners/:id')
  deleteBanner(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.deleteBanner(id, tenantId);
  }

  // ---------------------------------------------------------
  // Consent Logs & Compliance (Phase 4)
  // ---------------------------------------------------------

  @Post('consent-logs')
  recordConsentLog(@Body() dto: CreateCookieConsentLogDto, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.recordConsentLog(dto, tenantId);
  }

  @Get('consent-logs')
  getConsentLogs(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.getConsentLogs(tenantId);
  }

  @Get('compliance')
  getComplianceMetrics(@Query('websiteId') websiteId: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.cookiesManagementService.getComplianceMetrics(tenantId, websiteId);
  }
}
