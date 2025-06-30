
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { falApi } from '@/lib/falApi';

interface TrainingStatusProps {
  images: File[];
  triggerWord: string;
  onComplete: (modelUrl: string) => void;
  onTrainingId: (id: string) => void;
  zipUrl: string;
  testUrl?: string;
}

const TrainingStatus = ({ images, triggerWord, onComplete, onTrainingId, zipUrl, testUrl }: TrainingStatusProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'preparing' | 'training' | 'completed' | 'error'>('preparing');
  const [trainingId, setTrainingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const startTraining = async () => {
    try {
      setStatus('training');
      setProgress(10);

      const urlToUse = testUrl || zipUrl;
      console.log('Starting training with URL:', urlToUse);
      
      const data = await falApi.trainLora(urlToUse, triggerWord);
      
      setTrainingId(data.request_id);
      onTrainingId(data.request_id);
      setProgress(25);
      
      toast.success('Training started successfully!');
      
      // Start polling for status
      pollTrainingStatus(data.request_id);
    } catch (error) {
      console.error('Training error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Training failed');
      toast.error('Failed to start training. Please try again.');
    }
  };

  const pollTrainingStatus = async (requestId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const data = await falApi.getTrainingStatus(requestId);
        
        console.log('Training status:', data);
        
        if (data.status === 'COMPLETED') {
          setProgress(100);
          setStatus('completed');
          clearInterval(pollInterval);
          
          // Get the final result
          const result = await falApi.getTrainingResult(requestId);
          console.log('Training result:', result);
          
          if (result.diffusers_lora_file?.url) {
            onComplete(result.diffusers_lora_file.url);
            toast.success('LoRA training completed!');
          } else {
            throw new Error('No LoRA file URL in training result');
          }
        } else if (data.status === 'FAILED') {
          setStatus('error');
          setErrorMessage('Training failed on the server');
          clearInterval(pollInterval);
          toast.error('Training failed. Please try again.');
        } else {
          // Update progress based on status
          const progressMap: Record<string, number> = {
            'IN_PROGRESS': 75,
            'IN_QUEUE': 50,
          };
          const newProgress = progressMap[data.status] || 60;
          if (newProgress > progress) {
            setProgress(newProgress);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(pollInterval);
        setStatus('error');
        setErrorMessage('Failed to check training status');
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
        return 'Preparing to train your LoRA model...';
      case 'training':
        return 'Training your LoRA model...';
      case 'completed':
        return 'Training completed successfully!';
      case 'error':
        return `Training failed: ${errorMessage}`;
    }
  };

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center space-x-2">
          {getStatusIcon()}
          <span>Step 3: LoRA Training</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-medium">{getStatusText()}</p>
            <p className="text-gray-600">
              {testUrl ? (
                <>Training with test URL using trigger word "{triggerWord}"</>
              ) : (
                <>Training from uploaded files using trigger word "{triggerWord}"</>
              )}
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

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800 mb-2">Training Data URL:</p>
            <code className="text-xs bg-white p-2 rounded border font-mono text-blue-700 block break-all">
              {testUrl || zipUrl}
            </code>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="text-center">
              <div className="font-semibold">Source</div>
              <div>{testUrl ? 'Test URL' : 'Uploaded Files'}</div>
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
