// API key is stored in localStorage for security

export type VideoModel = 
  | 'fal-ai/bytedance/seedance/v1/pro/image-to-video'
  | 'fal-ai/kling-video/v2.1/master/image-to-video'
  | 'fal-ai/hunyuan-video-image-to-video'
  | 'fal-ai/minimax/hailuo-02/standard/image-to-video';

export const VIDEO_MODELS: { value: VideoModel; label: string }[] = [
  { value: 'fal-ai/bytedance/seedance/v1/pro/image-to-video', label: 'Seedance Pro' },
  { value: 'fal-ai/kling-video/v2.1/master/image-to-video', label: 'Kling Video' },
  { value: 'fal-ai/hunyuan-video-image-to-video', label: 'Hunyuan Video' },
  { value: 'fal-ai/minimax/hailuo-02/standard/image-to-video', label: 'Hailuo' },
];

export class FalApi {
  private apiKey: string;

  constructor() {
    this.apiKey = this.getApiKey();
  }

  private getApiKey(): string {
    const storedKey = localStorage.getItem('fal_api_key');
    if (!storedKey) {
      throw new Error('FAL API key not found. Please set your API key in the settings.');
    }
    return storedKey;
  }

  static setApiKey(apiKey: string): void {
    localStorage.setItem('fal_api_key', apiKey);
  }

  static hasApiKey(): boolean {
    return !!localStorage.getItem('fal_api_key');
  }

  static clearApiKey(): void {
    localStorage.removeItem('fal_api_key');
  }

  async generateImage(prompt: string, loraUrl: string): Promise<{ images: Array<{ url: string }> }> {
    console.log('Generating image with FAL API:', { prompt, loraUrl });
    
    // Initial request to queue the generation
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
        enable_safety_checker: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Generation API error:', errorData);
      throw new Error(`Generation failed: ${errorData.detail || response.statusText}`);
    }

    const queueResult = await response.json();
    console.log('Queue result:', queueResult);

    // If the response already contains images (immediate response), return them
    if (queueResult.images && queueResult.images.length > 0) {
      return queueResult;
    }

    // If queued, poll the status URL until completion
    if (queueResult.status === 'IN_QUEUE' && queueResult.status_url) {
      return this.pollForImageResult(queueResult.status_url, queueResult.response_url);
    }

    throw new Error('Unexpected response format from API');
  }

  private buildSeedanceParams(imageUrl: string, prompt: string) {
    return {
      prompt,
      image_url: imageUrl,
      resolution: "1080p",
      duration: "5",
      seed: -1,
    };
  }

  private buildKlingParams(imageUrl: string, prompt: string) {
    return {
      prompt,
      image_url: imageUrl,
      duration: "5",
      negative_prompt: "blur, distort, and low quality",
      cfg_scale: 0.5,
    };
  }

  private buildHunyuanParams(imageUrl: string, prompt: string) {
    return {
      prompt,
      image_url: imageUrl,
      aspect_ratio: "16:9",
      resolution: "720p",
      num_frames: 129,
      i2v_stability: false,
    };
  }

  private buildHailuoParams(imageUrl: string, prompt: string) {
    return {
      prompt,
      image_url: imageUrl,
      duration: "6",
      prompt_optimizer: true,
    };
  }

  async generateVideo(imageUrl: string, prompt: string, model: VideoModel = 'fal-ai/bytedance/seedance/v1/pro/image-to-video'): Promise<{ video: { url: string }, seed: number }> {
    console.log('Generating video with FAL API:', { imageUrl, prompt, model });
    
    // Build model-specific parameters
    let requestBody;
    switch (model) {
      case 'fal-ai/bytedance/seedance/v1/pro/image-to-video':
        requestBody = this.buildSeedanceParams(imageUrl, prompt);
        break;
      case 'fal-ai/kling-video/v2.1/master/image-to-video':
        requestBody = this.buildKlingParams(imageUrl, prompt);
        break;
      case 'fal-ai/hunyuan-video-image-to-video':
        requestBody = this.buildHunyuanParams(imageUrl, prompt);
        break;
      case 'fal-ai/minimax/hailuo-02/standard/image-to-video':
        requestBody = this.buildHailuoParams(imageUrl, prompt);
        break;
      default:
        requestBody = this.buildSeedanceParams(imageUrl, prompt);
    }

    console.log('Request body for model:', model, requestBody);
    
    // Initial request to queue the video generation
    const response = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Video generation API error:', errorData);
      throw new Error(`Video generation failed: ${errorData.detail || response.statusText}`);
    }

    const queueResult = await response.json();
    console.log('Video queue result:', queueResult);

    // If the response already contains video (immediate response), return it
    if (queueResult.video && queueResult.video.url) {
      return queueResult;
    }

    // If queued, poll the status URL until completion
    if (queueResult.status === 'IN_QUEUE' && queueResult.status_url) {
      return this.pollForVideoResult(queueResult.status_url, queueResult.response_url);
    }

    throw new Error('Unexpected response format from video API');
  }

  private async pollForImageResult(statusUrl: string, responseUrl: string): Promise<{ images: Array<{ url: string }> }> {
    console.log('Polling status URL:', statusUrl);
    
    const maxAttempts = 60; // 5 minutes max (5 second intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      try {
        const statusResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Key ${this.apiKey}`,
          },
        });

        if (!statusResponse.ok) {
          console.error('Status check failed:', statusResponse.statusText);
          continue;
        }

        const statusResult = await statusResponse.json();
        console.log(`Status check ${attempts}:`, statusResult);

        if (statusResult.status === 'COMPLETED') {
          console.log('Generation completed, fetching final result from:', responseUrl);
          
          // Fetch the actual result with images
          const resultResponse = await fetch(responseUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Key ${this.apiKey}`,
            },
          });

          if (!resultResponse.ok) {
            throw new Error(`Failed to fetch result: ${resultResponse.statusText}`);
          }

          const finalResult = await resultResponse.json();
          console.log('Final result:', finalResult);

          if (finalResult.images && finalResult.images.length > 0) {
            console.log('Generation completed successfully');
            return finalResult;
          } else {
            throw new Error('No images in final result');
          }
        }

        if (statusResult.status === 'FAILED') {
          throw new Error(`Generation failed: ${statusResult.error || 'Unknown error'}`);
        }

        // Continue polling if still IN_QUEUE or IN_PROGRESS
      } catch (error) {
        console.error('Error during status check:', error);
        if (attempts >= maxAttempts) {
          throw new Error('Status polling failed after maximum attempts');
        }
      }
    }

    throw new Error('Generation timed out after 5 minutes');
  }

  private async pollForVideoResult(statusUrl: string, responseUrl: string): Promise<{ video: { url: string }, seed: number }> {
    console.log('Polling video status URL:', statusUrl);
    
    const maxAttempts = 120; // 10 minutes max (5 second intervals) - videos take longer
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      try {
        const statusResponse = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Key ${this.apiKey}`,
          },
        });

        if (!statusResponse.ok) {
          console.error('Video status check failed:', statusResponse.statusText);
          continue;
        }

        const statusResult = await statusResponse.json();
        console.log(`Video status check ${attempts}:`, statusResult);

        if (statusResult.status === 'COMPLETED') {
          console.log('Video generation completed, fetching final result from:', responseUrl);
          
          // Fetch the actual result with video
          const resultResponse = await fetch(responseUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Key ${this.apiKey}`,
            },
          });

          if (!resultResponse.ok) {
            throw new Error(`Failed to fetch video result: ${resultResponse.statusText}`);
          }

          const finalResult = await resultResponse.json();
          console.log('Final video result:', finalResult);

          if (finalResult.video && finalResult.video.url) {
            console.log('Video generation completed successfully');
            return finalResult;
          } else {
            throw new Error('No video in final result');
          }
        }

        if (statusResult.status === 'FAILED') {
          throw new Error(`Video generation failed: ${statusResult.error || 'Unknown error'}`);
        }

        // Continue polling if still IN_QUEUE or IN_PROGRESS
      } catch (error) {
        console.error('Error during video status check:', error);
        if (attempts >= maxAttempts) {
          throw new Error('Video status polling failed after maximum attempts');
        }
      }
    }

    throw new Error('Video generation timed out after 10 minutes');
  }
}

export const falApi = new FalApi();
