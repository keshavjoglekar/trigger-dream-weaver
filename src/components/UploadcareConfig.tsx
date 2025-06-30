
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { UploadcareConfig } from '@/lib/uploadcare';

interface UploadcareConfigProps {
  onSave: (config: UploadcareConfig) => void;
  savedConfig?: UploadcareConfig | null;
}

const UploadcareConfigComponent = ({ onSave, savedConfig }: UploadcareConfigProps) => {
  const [publicKey, setPublicKey] = useState(savedConfig?.publicKey || '6fa93e955bb3ff14bef8');

  const handleSave = () => {
    if (!publicKey.trim()) {
      toast.error('Please enter your Uploadcare public key');
      return;
    }
    
    const config = { publicKey: publicKey.trim() };
    localStorage.setItem('uploadcare-config', JSON.stringify(config));
    onSave(config);
    toast.success('Uploadcare configuration saved successfully!');
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Upload size={20} />
          <span>Uploadcare Configuration</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure your Uploadcare public key for file uploads
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="publicKey">Uploadcare Public Key</Label>
          <Input
            id="publicKey"
            type="text"
            placeholder="Enter your public key"
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Find your public key in your Uploadcare dashboard
          </p>
        </div>
        
        <Button onClick={handleSave} className="w-full">
          <Save className="mr-2" size={16} />
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
};

export default UploadcareConfigComponent;
