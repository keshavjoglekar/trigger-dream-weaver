import React, { useState } from 'react';
import { Eye, EyeOff, Key, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FalApi } from '@/lib/falApi';

interface ApiKeySetupProps {
  onApiKeySet: () => void;
}

export function ApiKeySetup({ onApiKeySet }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValid, setIsValid] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setIsValid(false);
      return;
    }

    // Basic validation - FAL API keys typically have a specific format
    if (!apiKey.includes(':') || apiKey.length < 20) {
      setIsValid(false);
      return;
    }

    FalApi.setApiKey(apiKey.trim());
    setIsValid(true);
    onApiKeySet();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-primary/10 rounded-full">
            <Key className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>FAL API Key Required</CardTitle>
          <CardDescription>
            Enter your FAL API key to start generating images and videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your API key is stored locally in your browser and never sent to our servers.
            </AlertDescription>
          </Alert>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">FAL API Key</Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="your-fal-api-key:secret"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setIsValid(true);
                  }}
                  className={!isValid ? 'border-destructive' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {!isValid && (
                <p className="text-sm text-destructive">
                  Please enter a valid FAL API key (format: key:secret)
                </p>
              )}
            </div>
            
            <Button type="submit" className="w-full">
              Save API Key
            </Button>
          </form>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Don't have a FAL API key?</p>
            <a 
              href="https://fal.ai/dashboard" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Get one from fal.ai →
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}