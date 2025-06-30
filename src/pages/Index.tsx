
import { useState } from "react";
import { Zap, Image as ImageIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { falApi } from "@/lib/falApi";

const Index = () => {
  const [loraUrl, setLoraUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');

  const generateImage = async () => {
    if (!loraUrl.trim() || !prompt.trim()) {
      toast.error("Please provide both LoRA URL and prompt");
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('Submitting request...');
    
    try {
      console.log('Generating image with:', { prompt, loraUrl });
      
      // Show different status messages during generation
      const statusInterval = setInterval(() => {
        setGenerationStatus(prev => {
          if (prev.includes('Submitting')) return 'Queued for generation...';
          if (prev.includes('Queued')) return 'Processing your image...';
          if (prev.includes('Processing')) return 'Almost ready...';
          return 'Finalizing...';
        });
      }, 3000);

      const result = await falApi.generateImage(prompt, loraUrl);
      
      clearInterval(statusInterval);
      
      if (result.images && result.images.length > 0) {
        setGeneratedImage(result.images[0].url);
        setGenerationStatus('');
        toast.success('Image generated successfully!');
      } else {
        throw new Error('No image in response');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setGenerationStatus('');
      toast.error('Failed to generate image. Please check your LoRA URL and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Image downloaded!');
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            LoRA Image Generator
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Generate images using your LoRA model URL
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center flex items-center justify-center space-x-2">
                <Zap className="text-purple-500" size={24} />
                <span>Generate with LoRA</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="lora-url" className="text-lg font-medium">
                  LoRA Model URL
                </Label>
                <Input
                  id="lora-url"
                  placeholder="https://your-lora-model-url.com/model.safetensors"
                  value={loraUrl}
                  onChange={(e) => setLoraUrl(e.target.value)}
                  className="text-lg py-3"
                />
                <p className="text-sm text-gray-500">
                  Enter the URL of your trained LoRA model
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prompt" className="text-lg font-medium">
                  Prompt
                </Label>
                <Textarea
                  id="prompt"
                  placeholder="A beautiful portrait of a person in a garden, high quality, detailed"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px] text-lg"
                />
                <p className="text-sm text-gray-500">
                  Describe what you want to generate
                </p>
              </div>

              <Button
                onClick={generateImage}
                disabled={isGenerating || !loraUrl.trim() || !prompt.trim()}
                className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Clock className="mr-2 animate-spin" />
                    {generationStatus || 'Generating Image...'}
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2" />
                    Generate Image
                  </>
                )}
              </Button>

              {isGenerating && (
                <div className="text-center text-sm text-gray-600">
                  <p>This may take a few minutes. Please don't close the page.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {generatedImage && (
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">Generated Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
                <div className="flex space-x-4">
                  <Button
                    onClick={downloadImage}
                    variant="outline"
                    className="flex-1"
                  >
                    Download
                  </Button>
                  <Button
                    onClick={generateImage}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    disabled={isGenerating}
                  >
                    Generate Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
