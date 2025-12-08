import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PhotoUploadProps {
  entityType: "job" | "unit" | "claim";
  entityId: number;
  onSuccess?: () => void;
}

export default function PhotoUpload({ entityType, entityId, onSuccess }: PhotoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [clientVisible, setClientVisible] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit");
        return;
      }
      
      // Check file type
      if (!selectedFile.type.match(/image\/(jpeg|jpg|png|gif|webp)/i)) {
        setError("Only image files are allowed (JPEG, PNG, GIF, WebP)");
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please select a file to upload");
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("caption", caption);
      formData.append("entityType", entityType);
      formData.append("entityId", entityId.toString());
      formData.append("clientVisible", clientVisible.toString());
      
      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload photo");
      }
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/${entityType}s/${entityId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/photos/${entityType}/${entityId}`] });
      
      toast({
        title: "Photo uploaded successfully",
        description: "Your photo has been uploaded and saved.",
      });
      
      // Reset form
      setFile(null);
      setCaption("");
      setClientVisible(false);
      setPreview(null);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload photo");
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Failed to upload photo",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#465c50]">
          <Upload size={20} /> 
          Upload Photo Documentation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              {preview ? (
                <div className="relative h-64 w-full overflow-hidden rounded-md border">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 w-full rounded-md border border-dashed border-gray-300 bg-gray-50">
                  <Image className="h-10 w-10 text-gray-400 mb-2" />
                  <Label 
                    htmlFor="photo-upload" 
                    className="cursor-pointer text-sm text-gray-600 hover:text-[#f5901d]"
                  >
                    Click to select a photo
                    <span className="block text-xs text-gray-400 mt-1">
                      JPEG, PNG, GIF, WebP (Max 5MB)
                    </span>
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="caption">Caption (Optional)</Label>
              <Textarea
                id="caption"
                placeholder="Describe the photo..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="resize-none"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="client-visible">Visible to client</Label>
                <p className="text-xs text-gray-500">
                  Toggle ON to make this photo visible to the client
                </p>
              </div>
              <Switch
                id="client-visible"
                checked={clientVisible}
                onCheckedChange={setClientVisible}
              />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSubmit}
          disabled={isUploading || !file}
          className="w-full bg-[#f5901d] hover:bg-[#e07d0b]"
        >
          {isUploading ? "Uploading..." : "Upload Photo"}
        </Button>
      </CardFooter>
    </Card>
  );
}