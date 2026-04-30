import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TranslationService {
  private readonly baseUrl = process.env.BHASHINI_BASE_URL;
  private readonly interfaceKey = process.env.BHASHINI_INTERFACE_API_KEY;
  private readonly udyatKey = process.env.BHASHINI_UDYAT_KEY;
  private readonly enabled = process.env.ENABLE_BHASHINI === 'true';

  async translate(texts: string[], sourceLang: string, targetLang: string): Promise<string[]> {
    if (!this.enabled || !this.baseUrl || sourceLang === targetLang || !texts.length) {
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
            console.log(`Proteccio: Fetching translation batch from ${batchIndex} to ${batchIndex + batch.length}`);
            const response = await axios.post(
              this.baseUrl!,
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
                  'Authorization': this.interfaceKey,
                },
                timeout: 15000,
              },
            );

            console.log('Proteccio: Bhashini Raw Response for batch:', JSON.stringify(response.data).substring(0, 1000));

            const outputs = response.data?.pipelineResponse?.[0]?.output || [];
            batch.forEach((text, j) => {
              const translated = outputs[j]?.target || outputs.find((o: any) => o.source === text)?.target;
              translatedTexts[batchIndex + j] = translated?.trim() || text;
            });
          } catch (error) {
            console.error('Proteccio: Batch translation error', error.response?.data || error.message);
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
