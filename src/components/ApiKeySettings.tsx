import React, { useState } from 'react';
import { Eye, EyeOff, Key, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FalApi } from '@/lib/falApi';
import { useToast } from '@/hooks/use-toast';

export function ApiKeySettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [currentKeyVisible, setCurrentKeyVisible] = useState(false);
  const { toast } = useToast();

  const currentApiKey = localStorage.getItem('fal_api_key') || '';
  const maskedKey = currentApiKey ? `${currentApiKey.slice(0, 8)}...${currentApiKey.slice(-8)}` : '';

  const handleUpdateApiKey = () => {
    if (!newApiKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive",
      });
      return;
    }

    if (!newApiKey.includes(':') || newApiKey.length < 20) {
      toast({
        title: "Error",
        description: "Please enter a valid FAL API key (format: key:secret)",
        variant: "destructive",
      });
      return;
    }

    FalApi.setApiKey(newApiKey.trim());
    setNewApiKey('');
    setIsOpen(false);
    toast({
      title: "Success",
      description: "API key updated successfully",
    });
  };

  const handleClearApiKey = () => {
    FalApi.clearApiKey();
    // Force page reload to show API key setup
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          API Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Settings
          </DialogTitle>
          <DialogDescription>
            Manage your FAL API key for image and video generation
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current API Key Display */}
          <div className="space-y-2">
            <Label>Current API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                value={currentKeyVisible ? currentApiKey : maskedKey}
                readOnly
                type={currentKeyVisible ? 'text' : 'password'}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCurrentKeyVisible(!currentKeyVisible)}
              >
                {currentKeyVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Update API Key */}
          <div className="space-y-2">
            <Label htmlFor="newApiKey">New API Key</Label>
            <div className="flex items-center gap-2">
              <Input
                id="newApiKey"
                type={showApiKey ? 'text' : 'password'}
                placeholder="Enter new API key"
                value={newApiKey}
                onChange={(e) => setNewApiKey(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleUpdateApiKey} className="flex-1">
              Update API Key
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear API Key</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove your API key and you'll need to enter it again to use the app.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearApiKey}>
                    Clear API Key
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>Your API key is stored locally in your browser and never sent to our servers.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}