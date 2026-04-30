import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TranslationService {
  private readonly baseUrl = process.env.BHASHINI_BASE_URL;
  private readonly interfaceKey = process.env.BHASHINI_INTERFACE_API_KEY;
  private readonly udyatKey = process.env.BHASHINI_UDYAT_KEY;
  private readonly enabled = process.env.ENABLE_BHASHINI === 'true';

  async translate(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
    if (!this.enabled || !this.baseUrl || sourceLang === targetLang) {
      return texts;
    }

    try {
      const response = await axios.post(
        this.baseUrl,
        {
          pipelineTasks: [
            {
              taskType: 'translation',
              config: {
                language: {
                  sourceLanguage: sourceLang,
                  targetLanguage: targetLang,
                },
              },
            },
          ],
          inputData: {
            input: texts.map((text) => ({ source: text })),
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: this.interfaceKey,
            'ulca-api-key': this.udyatKey,
          },
          timeout: 5000,
        },
      );

      const outputs = response.data?.pipelineResponse?.[0]?.output || [];
      return texts.map((text, i) => outputs[i]?.target || text);
    } catch (error) {
      console.error('Proteccio: Translation failed', error.message);
      return texts;
    }
  }
}
