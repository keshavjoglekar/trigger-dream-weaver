
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
      return this.pollForResult(queueResult.status_url, queueResult.response_url);
    }

    throw new Error('Unexpected response format from API');
  }

  private async pollForResult(statusUrl: string, responseUrl: string): Promise<{ images: Array<{ url: string }> }> {
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
}

export const falApi = new FalApi();
