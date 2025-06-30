
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, FileArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface ImageUploadProps {
  onImagesUploaded: (images: File[]) => void;
}

const ImageUpload = ({ onImagesUploaded }: ImageUploadProps) => {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const imageFiles = acceptedFiles.filter(file => 
      file.type.startsWith('image/') || file.type === 'application/zip'
    );

    if (imageFiles.length === 0) {
      toast.error('Please upload only image files or ZIP archives');
      return;
    }

    // Handle ZIP files
    const zipFiles = imageFiles.filter(file => file.type === 'application/zip');
    const directImages = imageFiles.filter(file => file.type.startsWith('image/'));

    if (zipFiles.length > 0) {
      // For now, we'll treat ZIP files as valid uploads
      // In a real implementation, you'd extract and validate the contents
      toast.info('ZIP file uploaded. Contents will be extracted during training.');
      setImages(prev => [...prev, ...zipFiles]);
      setPreviews(prev => [...prev, ...Array(zipFiles.length).fill('')]);
    }

    if (directImages.length > 0) {
      const newPreviews = directImages.map(file => URL.createObjectURL(file));
      setImages(prev => [...prev, ...directImages]);
      setPreviews(prev => [...prev, ...newPreviews]);
    }

    const totalFiles = [...images, ...imageFiles];
    onImagesUploaded(totalFiles);
  }, [images, onImagesUploaded]);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    
    // Revoke object URL to prevent memory leaks
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }
    
    setImages(newImages);
    setPreviews(newPreviews);
    onImagesUploaded(newImages);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
      'application/zip': ['.zip']
    },
    multiple: true
  });

  return (
    <div className="space-y-6">
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all hover:border-purple-400 ${
          isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="flex justify-center space-x-4">
            <Upload size={48} className="text-purple-500" />
            <FileArchive size={48} className="text-blue-500" />
          </div>
          <div>
            <p className="text-xl font-semibold mb-2">
              {isDragActive ? 'Drop your files here' : 'Upload Images or ZIP File'}
            </p>
            <p className="text-gray-500">
              Drag & drop images or a ZIP file, or click to browse
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Supports: PNG, JPG, JPEG, WEBP, ZIP
            </p>
          </div>
        </div>
      </Card>

      {images.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Uploaded Files ({images.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((file, index) => (
              <div key={index} className="relative group">
                <Card className="overflow-hidden aspect-square">
                  {file.type === 'application/zip' ? (
                    <div className="flex items-center justify-center h-full bg-blue-50">
                      <div className="text-center">
                        <FileArchive size={32} className="text-blue-500 mx-auto mb-2" />
                        <p className="text-xs text-blue-600 truncate px-2">
                          {file.name}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={previews[index]}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X size={16} />
                  </Button>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
