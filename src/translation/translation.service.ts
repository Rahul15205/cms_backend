import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TranslationService {
  constructor(private configService: ConfigService) {}

  async translate(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
    const enabled = this.configService.get<string>('ENABLE_BHASHINI') === 'true';
    const baseUrl = this.configService.get<string>('BHASHINI_BASE_URL')?.replace(/"/g, '');
    const interfaceKey = this.configService.get<string>('BHASHINI_INTERFACE_API_KEY');

    if (!enabled || !baseUrl || sourceLang === targetLang || !texts.length) {
      return texts;
    }

    const CONCURRENCY = 25;
    const translatedTexts: string[] = new Array(texts.length);
    const batchPromises: Promise<void>[] = [];

    for (let i = 0; i < texts.length; i += CONCURRENCY) {
      const batch = texts.slice(i, i + CONCURRENCY);
      const batchIndex = i;
      
      batchPromises.push(
        (async () => {
          try {
            const response = await axios.post(
              baseUrl,
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
                  input: batch.map((text) => ({ source: text })),
                },
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                  'Authorization': interfaceKey!,
                },
                timeout: 15000,
              },
            );

            const outputs = response.data?.pipelineResponse?.[0]?.output || [];
            
            batch.forEach((text, j) => {
              const translated = outputs[j]?.target || outputs.find((o: any) => o.source === text)?.target;
              translatedTexts[batchIndex + j] = translated?.trim() || text;
            });
          } catch (error) {
            batch.forEach((text, j) => {
              translatedTexts[batchIndex + j] = text;
            });
          }
        })()
      );
    }

    await Promise.all(batchPromises);
    return translatedTexts;
  }
}
