
import { falApi } from './falApi';

// Mock API routes - In a real app, these would be server endpoints
export const mockApiServer = {
  async handleTrainLora(formData: FormData) {
    const images: File[] = [];
    const imageEntries = formData.getAll('images');
    const zipEntries = formData.getAll('zip_file');
    
    // Collect all image files
    [...imageEntries, ...zipEntries].forEach(entry => {
      if (entry instanceof File) {
        images.push(entry);
      }
    });

    const triggerWord = formData.get('trigger_word') as string;

    try {
      const result = await falApi.trainLora(images, triggerWord);
      return { success: true, data: result };
    } catch (error) {
      console.error('Training error:', error);
      return { success: false, error: error.message };
    }
  },

  async handleGetTrainingStatus(requestId: string) {
    try {
      const result = await falApi.getTrainingStatus(requestId);
      return { success: true, data: result };
    } catch (error) {
      console.error('Status check error:', error);
      return { success: false, error: error.message };
    }
  },

  async handleGenerateImage(body: { prompt: string; lora_url: string }) {
    try {
      const result = await falApi.generateImage(body.prompt, body.lora_url);
      return { success: true, data: result };
    } catch (error) {
      console.error('Generation error:', error);
      return { success: false, error: error.message };
    }
  },
};

// Mock fetch override for development
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString();
  
  if (url.startsWith('/api/train-lora')) {
    const formData = init?.body as FormData;
    const result = await mockApiServer.handleTrainLora(formData);
    
    return new Response(JSON.stringify(result.success ? result.data : { error: result.error }), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (url.includes('/api/training-status/')) {
    const requestId = url.split('/').pop();
    const result = await mockApiServer.handleGetTrainingStatus(requestId!);
    
    return new Response(JSON.stringify(result.success ? result.data : { error: result.error }), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  if (url.startsWith('/api/generate-image')) {
    const body = JSON.parse(init?.body as string);
    const result = await mockApiServer.handleGenerateImage(body);
    
    return new Response(JSON.stringify(result.success ? result.data : { error: result.error }), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return originalFetch(input, init);
};
