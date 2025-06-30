
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Save } from 'lucide-react';
import { toast } from 'sonner';
import { S3Config } from '@/lib/s3Upload';

interface AwsCredentialsProps {
  onSave: (config: S3Config) => void;
  savedConfig?: S3Config | null;
}

const AwsCredentials = ({ onSave, savedConfig }: AwsCredentialsProps) => {
  const [config, setConfig] = useState<S3Config>({
    accessKeyId: savedConfig?.accessKeyId || '',
    secretAccessKey: savedConfig?.secretAccessKey || '',
    bucketName: savedConfig?.bucketName || '',
    region: savedConfig?.region || 'us-east-1',
  });
  const [showSecret, setShowSecret] = useState(false);

  const handleSave = () => {
    if (!config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Save to localStorage
    localStorage.setItem('aws-s3-config', JSON.stringify(config));
    onSave(config);
    toast.success('AWS credentials saved successfully!');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">AWS S3 Configuration</CardTitle>
        <p className="text-sm text-gray-600">
          Enter your AWS credentials to upload files to S3
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="accessKeyId">Access Key ID *</Label>
            <Input
              id="accessKeyId"
              type="text"
              placeholder="AKIA..."
              value={config.accessKeyId}
              onChange={(e) => setConfig(prev => ({ ...prev, accessKeyId: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="secretAccessKey">Secret Access Key *</Label>
            <div className="relative">
              <Input
                id="secretAccessKey"
                type={showSecret ? 'text' : 'password'}
                placeholder="Enter secret key"
                value={config.secretAccessKey}
                onChange={(e) => setConfig(prev => ({ ...prev, secretAccessKey: e.target.value }))}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowSecret(!showSecret)}
              >
                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bucketName">S3 Bucket Name *</Label>
            <Input
              id="bucketName"
              type="text"
              placeholder="my-lora-bucket"
              value={config.bucketName}
              onChange={(e) => setConfig(prev => ({ ...prev, bucketName: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="region">AWS Region</Label>
            <Input
              id="region"
              type="text"
              placeholder="us-east-1"
              value={config.region}
              onChange={(e) => setConfig(prev => ({ ...prev, region: e.target.value }))}
            />
          </div>
        </div>
        
        <Button onClick={handleSave} className="w-full">
          <Save className="mr-2" size={16} />
          Save AWS Credentials
        </Button>
      </CardContent>
    </Card>
  );
};

export default AwsCredentials;
