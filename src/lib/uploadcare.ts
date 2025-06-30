
import { uploadFile, UploadcareSimpleAuthSchema } from '@uploadcare/upload-client';

export interface UploadcareConfig {
  publicKey: string;
}

export class UploadcareUploader {
  private publicKey: string;

  constructor(config: UploadcareConfig) {
    this.publicKey = config.publicKey;
  }

  async uploadFile(file: File): Promise<string> {
    try {
      const result = await uploadFile(file, {
        publicKey: this.publicKey,
        store: 'auto',
        metadata: {
          subsystem: 'lora-training',
          timestamp: Date.now().toString(),
        },
      });

      // Return the CDN URL for the uploaded file
      return `https://ucarecdn.com/${result.uuid}/`;
    } catch (error) {
      console.error('Uploadcare upload error:', error);
      throw new Error(`Failed to upload to Uploadcare: ${error}`);
    }
  }
}
