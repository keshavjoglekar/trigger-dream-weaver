
import JSZip from 'jszip';
import { UploadcareUploader, UploadcareConfig } from './uploadcare';

const FAL_API_KEY = 'adca3c41-c684-405c-a343-9bd42dfd8e1d:b97869943ebc2ec7a06fd1af92c0e6b3';

export class FalApi {
  private apiKey: string;
  private uploadcareUploader: UploadcareUploader | null = null;

  constructor() {
    this.apiKey = FAL_API_KEY;
  }

  setUploadcareConfig(config: UploadcareConfig) {
    this.uploadcareUploader = new UploadcareUploader(config);
  }

  private async createZipFromImages(images: File[]): Promise<Blob> {
    const zip = new JSZip();
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const arrayBuffer = await image.arrayBuffer();
      // Use original filename if available, otherwise generate one
      const extension = image.name.split('.').pop() || 'jpg';
      const fileName = image.name || `image_${i + 1}.${extension}`;
      zip.file(fileName, arrayBuffer);
    }
    
    // Generate ZIP with better compression settings
    return await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6
      }
    });
  }

  async trainLora(images: File[] | string, triggerWord: string): Promise<{ request_id: string }> {
    try {
      let imagesDataUrl: string;

      if (typeof images === 'string') {
        imagesDataUrl = images;
        console.log('Using direct URL:', imagesDataUrl);
      } else {
        if (!this.uploadcareUploader) {
          throw new Error('Uploadcare configuration not set. Please configure Uploadcare first.');
        }

        let fileToUpload: File;

        // Check if we already have a ZIP file
        if (images.length === 1 && images[0].type === 'application/zip') {
          fileToUpload = images[0];
          console.log('Using uploaded ZIP file:', fileToUpload.name);
        } else if (images.length === 1 && images[0].name.endsWith('.zip')) {
          // Handle ZIP files that might not have the correct MIME type
          fileToUpload = images[0];
          console.log('Using uploaded ZIP file (by extension):', fileToUpload.name);
        } else {
          // Create ZIP from individual images
          console.log('Creating ZIP from', images.length, 'images');
          const zipBlob = await this.createZipFromImages(images);
          fileToUpload = new File([zipBlob], 'training_images.zip', { type: 'application/zip' });
        }

        console.log('Uploading to Uploadcare...', {
          fileName: fileToUpload.name,
          fileType: fileToUpload.type,
          fileSize: fileToUpload.size
        });
        
        imagesDataUrl = await this.uploadcareUploader.uploadFile(fileToUpload);
        console.log('Uploadcare upload successful:', imagesDataUrl);
      }

      const requestBody = {
        images_data_url: imagesDataUrl,
        trigger_word: triggerWord,
        is_style: false,
        iter_multiplier: 1.0
      };

      console.log('Sending training request with:', { 
        triggerWord,
        dataUrl: imagesDataUrl
      });

      const response = await fetch(`https://queue.fal.run/fal-ai/flux-lora-fast-training`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Training API error:', errorData);
        throw new Error(`Training failed: ${JSON.stringify(errorData.detail) || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Training error in FalApi:', error);
      throw error;
    }
  }

  async getTrainingStatus(requestId: string): Promise<any> {
    const response = await fetch(`https://queue.fal.run/fal-ai/flux-lora-fast-training/requests/${requestId}/status`, {
      headers: {
        'Authorization': `Key ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return await response.json();
  }

  async getTrainingResult(requestId: string): Promise<any> {
    const response = await fetch(`https://queue.fal.run/fal-ai/flux-lora-fast-training/requests/${requestId}`, {
      headers: {
        'Authorization': `Key ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get result: ${response.statusText}`);
    }

    return await response.json();
  }

  async generateImage(prompt: string, loraUrl: string): Promise<{ images: Array<{ url: string }> }> {
    const response = await fetch(`https://queue.fal.run/fal-ai/flux-lora`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        loras: [
          {
            path: loraUrl,
            scale: 1,
          },
        ],
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        enable_safety_checker: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Generation failed: ${errorData.detail || response.statusText}`);
    }

    return await response.json();
  }
}

export const falApi = new FalApi();

export const testTrainLoraWithUrl = async (url: string, triggerWord: string) => {
  return await falApi.trainLora(url, triggerWord);
};
