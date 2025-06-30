
const FAL_API_KEY = 'adca3c41-c684-405c-a343-9bd42dfd8e1d:b97869943ebc2ec7a06fd1af92c0e6b3';
const FAL_API_BASE = 'https://fal.run/fal-ai';

export class FalApi {
  private apiKey: string;

  constructor() {
    this.apiKey = FAL_API_KEY;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async trainLora(images: File[], triggerWord: string): Promise<{ request_id: string }> {
    try {
      let requestBody: any = {
        trigger_word: triggerWord,
        is_style: false,
        iter_multiplier: 1.0
      };

      // Handle ZIP files vs individual images
      if (images.length === 1 && images[0].type === 'application/zip') {
        // For ZIP files, send as single data URL
        const zipDataUrl = await this.fileToBase64(images[0]);
        requestBody.images_data_url = zipDataUrl;
      } else {
        // For multiple individual images, we need to create a ZIP or send the first image
        // For now, let's send the first image as the API expects a single string
        const firstImageDataUrl = await this.fileToBase64(images[0]);
        requestBody.images_data_url = firstImageDataUrl;
        
        // Log a warning about multiple images
        if (images.length > 1) {
          console.warn(`Multiple images provided (${images.length}), but API expects single string. Using first image only.`);
        }
      }

      console.log('Sending training request with:', { 
        imageCount: images.length, 
        triggerWord,
        requestBodyKeys: Object.keys(requestBody)
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
