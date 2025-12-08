import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Camera, Image } from "lucide-react";

interface PhotoUploadProps {
  onPhotosChange: (photos: { file: File; dataUrl: string; caption?: string }[]) => void;
  existingPhotos?: Array<{ id: number; url: string }>;
}

export default function PhotoUpload({ onPhotosChange, existingPhotos = [] }: PhotoUploadProps) {
  const [photos, setPhotos] = useState<{ file: File; dataUrl: string; caption?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newPhotos: { file: File; dataUrl: string; caption?: string }[] = [];
      
      Array.from(e.target.files).forEach(file => {
        // Create preview URL
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            const newPhoto = {
              file,
              dataUrl: event.target.result as string,
              caption: ''
            };
            newPhotos.push(newPhoto);
            
            // If all files have been processed, update state
            if (newPhotos.length === e.target.files!.length) {
              const updatedPhotos = [...photos, ...newPhotos];
              setPhotos(updatedPhotos);
              onPhotosChange(updatedPhotos);
            }
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleCaptionChange = (index: number, caption: string) => {
    const updatedPhotos = [...photos];
    updatedPhotos[index].caption = caption;
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const handleRemovePhoto = (index: number) => {
    const updatedPhotos = photos.filter((_, i) => i !== index);
    setPhotos(updatedPhotos);
    onPhotosChange(updatedPhotos);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Photos */}
      {existingPhotos.length > 0 && (
        <div className="space-y-2">
          <Label>Existing Photos</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {existingPhotos.map((photo, index) => (
              <div 
                key={`existing-${index}`} 
                className="relative aspect-square rounded-md overflow-hidden border border-gray-200"
              >
                <img 
                  src={photo.url} 
                  alt={`Existing photo ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Photos */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <Label>New Photos</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <div 
                key={`new-${index}`} 
                className="relative group aspect-square rounded-md overflow-hidden border border-gray-200"
              >
                <img 
                  src={photo.dataUrl} 
                  alt={`New photo ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                  <Input
                    type="text"
                    placeholder="Add caption"
                    value={photo.caption || ''}
                    onChange={(e) => handleCaptionChange(index, e.target.value)}
                    className="mb-2 bg-white bg-opacity-90 text-sm"
                  />
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleRemovePhoto(index)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 transition-colors">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          multiple 
          className="hidden" 
        />
        
        <Camera className="h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 mb-2">
          {photos.length > 0 
            ? "Add more photos" 
            : "Take photos or upload them from your device"}
        </p>
        
        <div className="flex gap-2">
          <Button type="button" onClick={triggerFileInput} variant="outline">
            <Image className="h-4 w-4 mr-2" />
            Choose Files
          </Button>
        </div>
      </div>
    </div>
  );
}
