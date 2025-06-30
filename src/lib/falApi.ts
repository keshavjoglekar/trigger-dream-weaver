
const FAL_API_KEY = 'adca3c41-c684-405c-a343-9bd42dfd8e1d:b97869943ebc2ec7a06fd1af92c0e6b3';

export class FalApi {
  private apiKey: string;

  constructor() {
    this.apiKey = FAL_API_KEY;
  }

  async generateImage(prompt: string, loraUrl: string): Promise<{ images: Array<{ url: string }> }> {
    console.log('Generating image with FAL API:', { prompt, loraUrl });
    
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
      console.error('Generation API error:', errorData);
      throw new Error(`Generation failed: ${errorData.detail || response.statusText}`);
    }

    const result = await response.json();
    console.log('Generation result:', result);
    return result;
  }
}

export const falApi = new FalApi();
