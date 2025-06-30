
const FAL_API_KEY = 'adca3c41-c684-405c-a343-9bd42dfd8e1d:b97869943ebc2ec7a06fd1af92c0e6b3';
const FAL_API_BASE = 'https://fal.run/fal-ai';

export class FalApi {
  private apiKey: string;

  constructor() {
    this.apiKey = FAL_API_KEY;
  }

  async trainLora(images: File[], triggerWord: string): Promise<{ request_id: string }> {
    const formData = new FormData();
    
    // Add images or ZIP file
    images.forEach((file, index) => {
      if (file.type === 'application/zip') {
        formData.append('images_data_url', file);
      } else {
        formData.append('images_data_url', file);
      }
    });

    formData.append('trigger_word', triggerWord);
    formData.append('is_style', 'false');
    formData.append('iter_multiplier', '1.0');

    const response = await fetch(`${FAL_API_BASE}/flux-lora-fast-training`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Training failed: ${errorData.detail || response.statusText}`);
    }

    return await response.json();
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
