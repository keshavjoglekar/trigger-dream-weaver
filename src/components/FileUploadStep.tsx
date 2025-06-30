
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Cloud, CheckCircle, AlertCircle, FileArchive } from 'lucide-react';
import { toast } from 'sonner';
import { falApi } from '@/lib/falApi';
import { UploadcareConfig } from '@/lib/uploadcare';

interface FileUploadStepProps {
  images: File[];
  triggerWord: string;
  onStorageComplete: (zipUrl: string) => void;
  uploadcareConfig: UploadcareConfig | null;
}

const FileUploadStep = ({ images, triggerWord, onStorageComplete, uploadcareConfig }: FileUploadStepProps) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'preparing' | 'uploading' | 'completed' | 'error'>('preparing');
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const startUpload = async () => {
    if (!uploadcareConfig) {
      setStatus('error');
      setErrorMessage('Uploadcare configuration not found');
      return;
    }

    try {
      setStatus('uploading');
      setProgress(10);

      // Configure the API with Uploadcare
      falApi.setUploadcareConfig(uploadcareConfig);

      let fileToUpload: File;

      // Check if we already have a ZIP file
      if (images.length === 1 && (images[0].type === 'application/zip' || images[0].name.endsWith('.zip'))) {
        fileToUpload = images[0];
        console.log('Using uploaded ZIP file:', fileToUpload.name, fileToUpload.type);
        setProgress(30);
      } else {
        // Create ZIP from individual images
        console.log('Creating ZIP from', images.length, 'images');
        setProgress(20);
        
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          console.log(`Processing image ${i + 1}: ${image.name} (${image.type}, ${image.size} bytes)`);
          
          const arrayBuffer = await image.arrayBuffer();
          const extension = image.name.split('.').pop() || 'jpg';
          const fileName = image.name || `image_${i + 1}.${extension}`;
          zip.file(fileName, arrayBuffer);
          
          setProgress(20 + (i / images.length) * 20);
        }
        
        const zipBlob = await zip.generateAsync({ 
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: {
            level: 6
          }
        });
        
        fileToUpload = new File([zipBlob], 'training_images.zip', { type: 'application/zip' });
        console.log(`ZIP created successfully: ${zipBlob.size} bytes`);
        setProgress(50);
      }

      // Upload to Uploadcare
      console.log('Uploading to Uploadcare...', {
        fileName: fileToUpload.name,
        fileType: fileToUpload.type,
        fileSize: fileToUpload.size
      });
      
      setProgress(60);
      const uploadUrl = await falApi.uploadcareUploader!.uploadFile(fileToUpload);
      console.log('Uploadcare upload successful:', uploadUrl);
      
      setProgress(90);
      
      // Add a small delay to ensure the file is fully available
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setZipUrl(uploadUrl);
      setStatus('completed');
      setProgress(100);
      
      toast.success('File uploaded to storage successfully!');
      onStorageComplete(uploadUrl);
      
    } catch (error) {
      console.error('Storage upload error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      toast.error('Failed to upload to storage. Please try again.');
    }
  };

  useEffect(() => {
    startUpload();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'preparing':
      case 'uploading':
        return <Cloud className="animate-pulse text-blue-500" size={24} />;
      case 'completed':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={24} />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'preparing':
        return 'Preparing files for upload...';
      case 'uploading':
        return 'Uploading to cloud storage...';
      case 'completed':
        return 'Files uploaded successfully!';
      case 'error':
        return `Upload failed: ${errorMessage}`;
    }
  };

  return (
    <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center flex items-center justify-center space-x-2">
          {getStatusIcon()}
          <span>Step 2: Cloud Storage Upload</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-lg font-medium">{getStatusText()}</p>
            <p className="text-gray-600">
              {images.length === 1 && images[0].name.endsWith('.zip') 
                ? `Uploading ZIP file: ${images[0].name}`
                : `Processing ${images.length} images into ZIP archive`
              }
            </p>
          </div>
          
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-gray-500">{progress}% complete</p>
          </div>

          {zipUrl && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <FileArchive className="text-green-600" size={20} />
                <p className="text-sm font-medium text-green-800">File uploaded successfully!</p>
              </div>
              <code className="text-xs bg-white p-2 rounded border font-mono text-green-700 block">
                {zipUrl}
              </code>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="text-center">
              <div className="font-semibold">Files</div>
              <div>{images.length === 1 && images[0].name.endsWith('.zip') ? 'ZIP File' : `${images.length} Images`}</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Trigger Word</div>
              <div>"{triggerWord}"</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">Storage</div>
              <div>Uploadcare CDN</div>
            </div>
          </div>
        </div>

        {status === 'error' && (
          <Button
            onClick={startUpload}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Cloud className="mr-2" />
            Retry Upload
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUploadStep;
