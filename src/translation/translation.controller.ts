import { Controller, Post, Body } from '@nestjs/common';
import { TranslationService } from './translation.service';

@Controller('api/v1/public/translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @Post('batch')
  async translateBatch(@Body() body: { texts: string[]; sourceLang: string; targetLang: string }) {
    const translatedTexts = await this.translationService.translate(
      body.texts,
      body.sourceLang,
      body.targetLang,
    );
    return { success: true, data: translatedTexts };
  }
}
