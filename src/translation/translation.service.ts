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

    console.log(`Proteccio: Translating ${texts.length} items from ${sourceLang} to ${targetLang}`);

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
                serviceId: "",
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
            'Accept': 'application/json',
            'Authorization': this.interfaceKey,
          },
          timeout: 10000,
        },
      );

      if (!response.data || !response.data.pipelineResponse) {
        console.warn('Proteccio: Unexpected Bhashini response structure', JSON.stringify(response.data).substring(0, 500));
        return texts;
      }

      const outputs = response.data.pipelineResponse[0]?.output || [];
      console.log(`Proteccio: Translation successful for ${outputs.length} items`);
      return texts.map((text, i) => outputs[i]?.target || text);
    } catch (error) {
      console.error('Proteccio: Translation API error', error.response?.data || error.message);
      return texts;
    }
  }
}
