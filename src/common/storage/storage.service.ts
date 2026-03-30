import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private supabase: SupabaseClient;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL', '');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY', '');
    this.bucket = this.configService.get<string>('SUPABASE_BUCKET', 'cms-reports');

    if (supabaseUrl && supabaseKey && !supabaseUrl.includes('<your_supabase_project_id>')) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase storage client initialized successfully');
    } else {
      this.logger.warn('Supabase URL or Key is missing. StorageService is disabled.');
    }
  }

  async uploadFile(path: string, buffer: Buffer, contentType: string): Promise<string> {
    if (!this.supabase) throw new Error('Supabase Storage not configured. Please add keys to .env');

    this.logger.log(`Uploading file ${path} to Supabase bucket: ${this.bucket}`);
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      this.logger.error(`Failed to upload ${path} to Supabase: ${error.message}`);
      throw error;
    }

    return data.path;
  }

  async getSignedUrl(path: string, expiresInSeconds: number = 60): Promise<string> {
    if (!this.supabase) throw new Error('Supabase Storage not configured. Please add keys to .env');

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(path, expiresInSeconds);

    if (error) {
      this.logger.error(`Failed to generate signed URL for ${path}: ${error.message}`);
      throw error;
    }

    return data.signedUrl;
  }
}
