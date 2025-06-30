
import JSZip from 'jszip';

const FAL_API_KEY = 'adca3c41-c684-405c-a343-9bd42dfd8e1d:b97869943ebc2ec7a06fd1af92c0e6b3';

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

    // Use the correct Fal.ai storage upload endpoint
    const endpoint = 'https://storage.fal.run/files/upload';
    
    console.log(`Uploading file to: ${endpoint}`);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Storage upload successful:`, data);
      return data.url || data.file_url || data.download_url;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Storage upload failed:`, response.status, errorData);
      throw new Error(`Upload failed: ${errorData.detail || response.statusText} (Status: ${response.status})`);
    }
  }

  async trainLora(images: File[] | string, triggerWord: string): Promise<{ request_id: string }> {
    try {
      let imagesDataUrl: string;

      // Check if images is a direct URL string (for testing)
      if (typeof images === 'string') {
        imagesDataUrl = images;
        console.log('Using direct URL for testing:', imagesDataUrl);
      } else {
        // Handle File[] as before
        let zipBlob: Blob;
        let fileName: string;

        if (images.length === 1 && images[0].type === 'application/zip') {
          zipBlob = images[0];
          fileName = images[0].name;
        } else {
          zipBlob = await this.createZipFromImages(images);
          fileName = 'training_images.zip';
        }

        console.log('Preparing ZIP file for upload...');
        imagesDataUrl = await this.uploadFile(zipBlob, fileName);
        console.log('Images data prepared successfully');
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

      // Use the queue endpoint for training
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
        
        // Better error handling for 403 Forbidden on S3 URLs
        if (errorData.detail?.[0]?.msg?.includes('403: Forbidden')) {
          throw new Error(`The provided URL is not publicly accessible. Please check the S3 bucket permissions or use a different publicly accessible URL.`);
        }
        
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

// Export a test function for direct URL training
export const testTrainLoraWithUrl = async (url: string, triggerWord: string) => {
  return await falApi.trainLora(url, triggerWord);
};
