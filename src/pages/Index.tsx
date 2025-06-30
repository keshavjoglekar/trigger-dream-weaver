
import { useState } from "react";
import { Upload, Zap, Image as ImageIcon, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import TrainingStatus from "@/components/TrainingStatus";
import ImageGeneration from "@/components/ImageGeneration";

type Step = 'upload' | 'training' | 'generate';

const Index = () => {
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [triggerWord, setTriggerWord] = useState('');
  const [trainingId, setTrainingId] = useState<string | null>(null);
  const [loraModelUrl, setLoraModelUrl] = useState<string | null>(null);

  const handleImagesUploaded = (images: File[]) => {
    setUploadedImages(images);
    toast.success(`${images.length} images uploaded successfully!`);
  };

  const handleStartTraining = () => {
    if (uploadedImages.length === 0 || !triggerWord.trim()) {
      toast.error("Please upload images and enter a trigger word");
      return;
    }
    setCurrentStep('training');
    toast.info("Starting LoRA training...");
  };

  const handleTrainingComplete = (modelUrl: string) => {
    setLoraModelUrl(modelUrl);
    setCurrentStep('generate');
    toast.success("LoRA model trained successfully! Ready to generate images.");
  };

  const steps = [
    { id: 'upload', label: 'Upload & Configure', icon: Upload },
    { id: 'training', label: 'Train LoRA', icon: Zap },
    { id: 'generate', label: 'Generate Images', icon: ImageIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            AI LoRA Studio
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Train your own AI model with your images, then generate stunning personalized artwork
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = 
                (step.id === 'upload' && uploadedImages.length > 0) ||
                (step.id === 'training' && loraModelUrl) ||
                (step.id === 'generate' && loraModelUrl);
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all ${
                    isActive 
                      ? 'bg-purple-100 text-purple-700 border-2 border-purple-300' 
                      : isCompleted 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle size={20} />
                    ) : (
                      <Icon size={20} />
                    )}
                    <span className="font-medium">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 ${isCompleted ? 'bg-green-300' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {currentStep === 'upload' && (
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-center">Upload Your Images</CardTitle>
                <p className="text-center text-gray-600">
                  Upload 5-20 high-quality images of your subject
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ImageUpload onImagesUploaded={handleImagesUploaded} />
                
                <div className="space-y-2">
                  <Label htmlFor="trigger-word" className="text-lg font-medium">
                    Trigger Word
                  </Label>
                  <Input
                    id="trigger-word"
                    placeholder="e.g., 'mydog', 'mycorp', 'mystyle'"
                    value={triggerWord}
                    onChange={(e) => setTriggerWord(e.target.value)}
                    className="text-lg py-3"
                  />
                  <p className="text-sm text-gray-500">
                    This word will be used to trigger your custom style in prompts
                  </p>
                </div>

                <Button
                  onClick={handleStartTraining}
                  disabled={uploadedImages.length === 0 || !triggerWord.trim()}
                  className="w-full py-6 text-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Zap className="mr-2" />
                  Start Training LoRA Model
                </Button>
              </CardContent>
            </Card>
          )}

          {currentStep === 'training' && (
            <TrainingStatus
              images={uploadedImages}
              triggerWord={triggerWord}
              onComplete={handleTrainingComplete}
              onTrainingId={setTrainingId}
            />
          )}

          {currentStep === 'generate' && loraModelUrl && (
            <ImageGeneration
              loraModelUrl={loraModelUrl}
              triggerWord={triggerWord}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
