
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface TrainingStatusProps {
  images: File[];
  triggerWord: string;
  onComplete: (modelUrl: string) => void;
  onTrainingId: (id: string) => void;
}

const TrainingStatus = ({ images, triggerWord, onComplete, onTrainingId }: TrainingStatusProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'preparing' | 'training' | 'completed' | 'error'>('preparing');
  const [trainingId, setTrainingId] = useState<string | null>(null);

  const startTraining = async () => {
    try {
      const formData = new FormData();
      
      // Add images to form data - handle both regular images and ZIP files
      images.forEach((file, index) => {
        if (file.type === 'application/zip') {
          formData.append('zip_file', file);
        } else {
          formData.append('images', file);
        }
      });
      
      formData.append('trigger_word', triggerWord);

      const response = await fetch('/api/train-lora', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to start training');
      }

      const data = await response.json();
      setTrainingId(data.request_id);
      onTrainingId(data.request_id);
      setStatus('training');
      toast.success('Training started successfully!');
      
      // Start polling for status
      pollTrainingStatus(data.request_id);
    } catch (error) {
      console.error('Training error:', error);
      setStatus('error');
      toast.error('Failed to start training. Please try again.');
    }
  };

  const pollTrainingStatus = async (requestId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/training-status/${requestId}`);
        const data = await response.json();
        
        if (data.status === 'completed') {
          setProgress(100);
          setStatus('completed');
          clearInterval(pollInterval);
          onComplete(data.diffusers_lora_file.url);
          toast.success('LoRA training completed!');
        } else if (data.status === 'failed') {
          setStatus('error');
          clearInterval(pollInterval);
          toast.error('Training failed. Please try again.');
        } else {
          // Update progress based on status
          const progressMap = {
            'IN_PROGRESS': 75,
            'IN_QUEUE': 25,
          };
          setProgress(progressMap[data.status as keyof typeof progressMap] || 50);
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(pollInterval);
        setStatus('error');
        toast.error('Failed to check training status');
      }
    }, 5000); // Poll every 5 seconds
  };

  useEffect(() => {
    startTraining();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'preparing':
      case 'training':
        return <Zap className="animate-pulse text-purple-500" size={24} />;
      case 'completed':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={24} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'preparing':
        return 'Preparing your images...';
      case 'training':
        return 'Training your LoRA model...';
      case 'completed':
        return 'Training completed successfully!';
      case 'error':
        return 'Training failed. Please try again.';
    }
  };

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center space-x-2">
          {getStatusIcon()}
          <span>LoRA Training</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-medium">{getStatusText()}</p>
            <p className="text-gray-600">
              Training with {images.length} images using trigger word "{triggerWord}"
            </p>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-gray-500">{progress}% complete</p>
          </div>

          {trainingId && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Training ID:</p>
              <code className="text-xs bg-white p-2 rounded border font-mono">
                {trainingId}
              </code>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="text-center">
              <div className="font-semibold">Images</div>
              <div>{images.length}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Trigger Word</div>
              <div>"{triggerWord}"</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Model</div>
              <div>FLUX LoRA</div>
            </div>
          </div>
        </div>

        {status === 'error' && (
          <Button
            onClick={startTraining}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Zap className="mr-2" />
            Retry Training
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainingStatus;
