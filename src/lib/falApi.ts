
const FAL_API_KEY = 'adca3c41-c684-405c-a343-9bd42dfd8e1d:b97869943ebc2ec7a06fd1af92c0e6b3';

export class FalApi {
  private apiKey: string;

  constructor() {
    this.apiKey = FAL_API_KEY;
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
        enable_safety_checker: true,
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

  async generateVideo(imageUrl: string, prompt: string): Promise<{ video: { url: string }, seed: number }> {
    console.log('Generating video with FAL API:', { imageUrl, prompt });
    
    // Initial request to queue the video generation
    const response = await fetch(`https://queue.fal.run/fal-ai/bytedance/seedance/v1/pro/image-to-video`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        image_url: imageUrl,
        resolution: "1080p",
        duration: "5",
        seed: -1,
      }),
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
