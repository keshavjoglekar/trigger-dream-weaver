
import { useState } from "react";
import { Zap, Image as ImageIcon, Clock, Video, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { falApi, VideoModel, VIDEO_MODELS } from "@/lib/falApi";

// RetroGrid background adapted from hero-section for full-page theme
const RetroGrid = ({
  angle = 65,
  cellSize = 60,
  opacity = 0.5,
  lightLineColor = "gray",
  darkLineColor = "gray",
}: {
  angle?: number;
  cellSize?: number;
  opacity?: number;
  lightLineColor?: string;
  darkLineColor?: string;
}) => {
  const gridStyles = {
    "--grid-angle": `${angle}deg`,
    "--cell-size": `${cellSize}px`,
    "--opacity": opacity,
    "--light-line": lightLineColor,
    "--dark-line": darkLineColor,
  } as React.CSSProperties;

  return (
    <div
      className={
        "pointer-events-none absolute inset-0 overflow-hidden [perspective:200px] opacity-[var(--opacity)]"
      }
      style={gridStyles}
    >
      <div className="absolute inset-0 [transform:rotateX(var(--grid-angle))]">
        <div className="animate-grid [background-image:linear-gradient(to_right,var(--light-line)_1px,transparent_0),linear-gradient(to_bottom,var(--light-line)_1px,transparent_0)] [background-repeat:repeat] [background-size:var(--cell-size)_var(--cell-size)] [height:300vh] [inset:0%_0px] [margin-left:-200%] [transform-origin:100%_0_0] [width:600vw] dark:[background-image:linear-gradient(to_right,var(--dark-line)_1px,transparent_0),linear-gradient(to_bottom,var(--dark-line)_1px,transparent_0)]" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent to-90% dark:from-black" />
    </div>
  );
};

const Index = () => {
  const [loraUrl, setLoraUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");

  const [videoPrompt, setVideoPrompt] = useState("");
  const [selectedVideoModel, setSelectedVideoModel] = useState<VideoModel>(
    "fal-ai/bytedance/seedance/v1/pro/image-to-video"
  );
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<string>(
    ""
  );

  const generateImage = async () => {
    if (!loraUrl.trim() || !prompt.trim()) {
      toast.error("Please provide both LoRA URL and prompt");
      return;
    }

    setIsGenerating(true);
    setGenerationStatus("Submitting request...");

    try {
      const statusInterval = setInterval(() => {
        setGenerationStatus((prev) => {
          if (prev.includes("Submitting")) return "Queued for generation...";
          if (prev.includes("Queued")) return "Processing your image...";
          if (prev.includes("Processing")) return "Almost ready...";
          return "Finalizing...";
        });
      }, 3000);

      const result = await falApi.generateImage(prompt, loraUrl);
      clearInterval(statusInterval);

      if (result.images && result.images.length > 0) {
        setGeneratedImage(result.images[0].url);
        setGenerationStatus("");
        toast.success("Image generated successfully!");
      } else {
        throw new Error("No image in response");
      }
    } catch (error) {
      setGenerationStatus("");
      toast.error(
        "Failed to generate image. Please check your LoRA URL and try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!generatedImage || !videoPrompt.trim()) {
      toast.error("Please enter a video prompt");
      return;
    }

    setIsGeneratingVideo(true);
    setVideoGenerationStatus("Submitting video request...");

    try {
      const statusInterval = setInterval(() => {
        setVideoGenerationStatus((prev) => {
          if (prev.includes("Submitting"))
            return "Queued for video generation...";
          if (prev.includes("Queued")) return "Processing your video...";
          if (prev.includes("Processing")) return "Creating video frames...";
          return "Almost ready...";
        });
      }, 4000);

      const result = await falApi.generateVideo(
        generatedImage,
        videoPrompt,
        selectedVideoModel
      );

      clearInterval(statusInterval);

      if (result.video && result.video.url) {
        setGeneratedVideo(result.video.url);
        setVideoGenerationStatus("");
        toast.success("Video generated successfully!");
      } else {
        throw new Error("No video in response");
      }
    } catch (error) {
      setVideoGenerationStatus("");
      toast.error("Failed to generate video. Please try again.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded!");
    } catch {
      toast.error("Failed to download image");
    }
  };

  const downloadVideo = async () => {
    if (!generatedVideo) return;
    try {
      const response = await fetch(generatedVideo);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generated-video-${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Video downloaded!");
    } catch {
      toast.error("Failed to download video");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Radial + grid background from hero theme */}
      <div className="absolute top-0 z-[0] h-screen w-screen bg-purple-950/10 dark:bg-purple-950/10 bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_20%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
      <RetroGrid angle={65} opacity={0.4} cellSize={50} lightLineColor="#4a4a4a" darkLineColor="#2a2a2a" />

      <header className="relative z-10 max-w-screen-xl mx-auto px-4 pt-20 text-center">
        <h1 className="text-sm text-gray-600 dark:text-gray-400 group font-geist mx-auto px-5 py-2 bg-gradient-to-tr from-zinc-300/20 via-gray-400/20 to-transparent dark:from-zinc-300/5 dark:via-gray-400/5 border-[2px] border-black/5 dark:border-white/5 rounded-3xl w-fit animate-fade-in">
          AI Image & Video Generator
        </h1>
        <p className="mt-4 text-4xl tracking-tighter font-geist bg-clip-text text-transparent mx-auto md:text-6xl bg-[linear-gradient(180deg,_#000_0%,_rgba(0,_0,_0,_0.75)_100%)] dark:bg-[linear-gradient(180deg,_#FFF_0%,_rgba(255,_255,_255,_0.00)_202.08%)]">
          Create with
          <span className="ml-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-300 dark:to-orange-200">
            LoRA + Video Models
          </span>
        </p>
        <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300 mt-4">
          Generate an image with your LoRA, then animate it using Kling, Hunyuan, Hailuo and more.
        </p>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Image Generation */}
        <Card className="shadow-lg border-[2px] border-black/5 dark:border-white/5 bg-white/70 dark:bg-gray-950/60 backdrop-blur animate-fade-in">
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
                className="text-lg py-3 bg-white/70 dark:bg-gray-900/60 border border-black/10 dark:border-white/10"
              />
              <p className="text-sm text-gray-500">Enter the URL of your trained LoRA model</p>
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
                className="min-h-[100px] text-lg bg-white/70 dark:bg-gray-900/60 border border-black/10 dark:border-white/10"
              />
              <p className="text-sm text-gray-500">Describe what you want to generate</p>
            </div>

            <Button
              onClick={generateImage}
              disabled={isGenerating || !loraUrl.trim() || !prompt.trim()}
              className="w-full py-6 text-lg bg-gradient-to-tr from-zinc-300/20 via-purple-400/30 to-transparent dark:from-zinc-300/5 dark:via-purple-400/20 text-gray-900 dark:text-white border-input border hover:from-zinc-300/30 hover:via-purple-400/40 transition-all"
            >
              {isGenerating ? (
                <>
                  <Clock className="mr-2 animate-spin" />
                  {generationStatus || "Generating Image..."}
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
          <Card className="shadow-lg border-[2px] border-black/5 dark:border-white/5 bg-white/70 dark:bg-gray-950/60 backdrop-blur animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl">Generated Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full rounded-lg shadow hover-scale border border-black/10 dark:border-white/10"
                />
              </div>
              <div className="flex space-x-4">
                <Button onClick={downloadImage} variant="outline" className="flex-1">
                  <Download className="mr-2" size={16} />
                  Download Image
                </Button>
                <Button
                  onClick={generateImage}
                  className="flex-1 bg-gradient-to-tr from-zinc-300/20 via-purple-400/30 to-transparent dark:from-zinc-300/5 dark:via-purple-400/20 text-gray-900 dark:text-white border"
                  disabled={isGenerating}
                >
                  Generate Another
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {generatedImage && (
          <Card className="shadow-lg border-[2px] border-black/5 dark:border-white/5 bg-white/70 dark:bg-gray-950/60 backdrop-blur animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl flex items-center space-x-2">
                <Video className="text-blue-500" size={24} />
                <span>Generate Video from Image</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="video-model" className="text-lg font-medium">
                  Video Model
                </Label>
                <Select
                  value={selectedVideoModel}
                  onValueChange={(value: VideoModel) => setSelectedVideoModel(value)}
                >
                  <SelectTrigger className="text-lg py-3 bg-white/70 dark:bg-gray-900/60 border border-black/10 dark:border-white/10">
                    <SelectValue placeholder="Select a video model" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 dark:bg-gray-950/90 border border-black/10 dark:border-white/10 shadow-lg z-50">
                    {VIDEO_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">Choose the AI model for video generation</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-prompt" className="text-lg font-medium">
                  Video Prompt
                </Label>
                <Textarea
                  id="video-prompt"
                  placeholder="A person walking through the garden, camera following smoothly"
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  className="min-h-[100px] text-lg bg-white/70 dark:bg-gray-900/60 border border-black/10 dark:border-white/10"
                />
                <p className="text-sm text-gray-500">Describe how you want the image to be animated</p>
              </div>

              <Button
                onClick={generateVideo}
                disabled={isGeneratingVideo || !videoPrompt.trim()}
                className="w-full py-6 text-lg bg-gradient-to-tr from-zinc-300/20 via-purple-400/30 to-transparent dark:from-zinc-300/5 dark:via-purple-400/20 text-gray-900 dark:text-white border"
              >
                {isGeneratingVideo ? (
                  <>
                    <Clock className="mr-2 animate-spin" />
                    {videoGenerationStatus || "Generating Video..."}
                  </>
                ) : (
                  <>
                    <Video className="mr-2" />
                    Generate Video
                  </>
                )}
              </Button>

              {isGeneratingVideo && (
                <div className="text-center text-sm text-gray-600">
                  <p>Video generation takes 5-10 minutes. Please be patient.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {generatedVideo && (
          <Card className="shadow-lg border-[2px] border-black/5 dark:border-white/5 bg-white/70 dark:bg-gray-950/60 backdrop-blur animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl">Generated Video</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <video
                  src={generatedVideo}
                  controls
                  className="w-full rounded-lg shadow border border-black/10 dark:border-white/10"
                  preload="metadata"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="flex space-x-4">
                <Button onClick={downloadVideo} variant="outline" className="flex-1">
                  <Download className="mr-2" size={16} />
                  Download Video
                </Button>
                <Button
                  onClick={generateVideo}
                  className="flex-1 bg-gradient-to-tr from-zinc-300/20 via-purple-400/30 to-transparent dark:from-zinc-300/5 dark:via-purple-400/20 text-gray-900 dark:text-white border"
                  disabled={isGeneratingVideo}
                >
                  Generate Another Video
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Index;

