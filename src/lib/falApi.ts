
import JSZip from 'jszip';

const FAL_API_KEY = 'adca3c41-c684-405c-a343-9bd42dfd8e1d:b97869943ebc2ec7a06fd1af92c0e6b3';
const FAL_API_BASE = 'https://fal.run/fal-ai';

export class FalApi {
  private apiKey: string;

  constructor() {
    this.apiKey = FAL_API_KEY;
  }

  private async createZipFromImages(images: File[]): Promise<Blob> {
    const zip = new JSZip();
    
    // Add each image to the ZIP
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const arrayBuffer = await image.arrayBuffer();
      const fileName = `image_${i + 1}.${image.name.split('.').pop() || 'jpg'}`;
      zip.file(fileName, arrayBuffer);
    }
    
    // Generate ZIP file as blob
    return await zip.generateAsync({ type: 'blob' });
  }

  private async uploadFile(file: Blob, fileName: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file, fileName);

    // Use the correct Fal.ai file upload endpoint
    const response = await fetch('https://fal.run/storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('File upload error:', errorData);
      
      // If storage upload fails, try using base64 data URL as fallback
      console.log('Storage upload failed, falling back to base64 data URL...');
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const data = await response.json();
    return data.url;
  }

  async trainLora(images: File[], triggerWord: string): Promise<{ request_id: string }> {
    try {
      let zipBlob: Blob;
      let fileName: string;

      // Handle ZIP files vs individual images
      if (images.length === 1 && images[0].type === 'application/zip') {
        // For ZIP files, use as-is
        zipBlob = images[0];
        fileName = images[0].name;
      } else {
        // For multiple individual images, create a ZIP file
        zipBlob = await this.createZipFromImages(images);
        fileName = 'training_images.zip';
      }

      // Try to upload the ZIP file to Fal.ai storage, fallback to base64
      console.log('Preparing ZIP file for upload...');
      const imagesDataUrl = await this.uploadFile(zipBlob, fileName);
      console.log('Images data prepared successfully');

      const requestBody = {
        images_data_url: imagesDataUrl,
        trigger_word: triggerWord,
        is_style: false,
        iter_multiplier: 1.0
      };

      console.log('Sending training request with:', { 
        imageCount: images.length, 
        triggerWord,
        dataUrlType: imagesDataUrl.startsWith('data:') ? 'base64' : 'url'
      });

      const response = await fetch(`${FAL_API_BASE}/flux-lora-fast-training`, {
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
        throw new Error(`Training failed: ${errorData.detail || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Training error in FalApi:', error);
      throw error;
    }
  }

  async getTrainingStatus(requestId: string): Promise<any> {
    const response = await fetch(`${FAL_API_BASE}/flux-lora-fast-training/requests/${requestId}/status`, {
      headers: {
        'Authorization': `Key ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return await response.json();
  }

  async generateImage(prompt: string, loraUrl: string): Promise<{ images: Array<{ url: string }> }> {
    const response = await fetch(`${FAL_API_BASE}/flux-lora`, {
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
