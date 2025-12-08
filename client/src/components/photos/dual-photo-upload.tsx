import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Image, AlertCircle, Camera, Truck, Wrench } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DualPhotoUploadProps {
  jobId: number;
  unitId: number;
  onSuccess?: () => void;
}

export default function DualPhotoUpload({ jobId, unitId, onSuccess }: DualPhotoUploadProps) {
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
        setError("La taille du fichier dépasse la limite de 5Mo");
        return;
      }
      
      // Check file type
      if (!selectedFile.type.match(/image\/(jpeg|jpg|png|gif|webp)/i)) {
        setError("Seuls les fichiers image sont autorisés (JPEG, PNG, GIF, WebP)");
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
      setError("Veuillez sélectionner une image à téléverser");
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Première étape : téléverser la photo pour le travail
      const jobFormData = new FormData();
      jobFormData.append("photo", file);
      jobFormData.append("caption", caption);
      jobFormData.append("entityType", "job");
      jobFormData.append("entityId", jobId.toString());
      jobFormData.append("clientVisible", clientVisible.toString());
      
      const jobResponse = await fetch("/api/photos", {
        method: "POST",
        body: jobFormData,
        credentials: "include",
      });
      
      if (!jobResponse.ok) {
        const errorData = await jobResponse.json();
        throw new Error(errorData.message || "Échec du téléversement de la photo pour le travail");
      }

      // Deuxième étape : téléverser la même photo pour l'unité
      const unitFormData = new FormData();
      unitFormData.append("photo", file);
      unitFormData.append("caption", caption);
      unitFormData.append("entityType", "unit");
      unitFormData.append("entityId", unitId.toString());
      unitFormData.append("clientVisible", clientVisible.toString());
      
      const unitResponse = await fetch("/api/photos", {
        method: "POST",
        body: unitFormData,
        credentials: "include",
      });
      
      if (!unitResponse.ok) {
        const errorData = await unitResponse.json();
        throw new Error(errorData.message || "Échec du téléversement de la photo pour l'unité");
      }
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/jobs/${jobId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/units/${unitId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/photos/job/${jobId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/photos/unit/${unitId}`] });
      
      toast({
        title: "Photo téléversée avec succès",
        description: "Votre photo a été ajoutée au travail et à l'unité.",
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
      setError(err instanceof Error ? err.message : "Échec du téléversement de la photo");
      toast({
        variant: "destructive",
        title: "Échec du téléversement",
        description: err instanceof Error ? err.message : "Échec du téléversement de la photo",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="flex items-center gap-2 text-[#465c50]">
          <Camera size={20} /> 
          Documentation photo
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="mb-4 flex items-center justify-center space-x-2 text-center text-sm text-gray-500 bg-gray-50 p-2 rounded-md">
          <div className="flex items-center">
            <Wrench className="h-4 w-4 text-[#f5901d] mr-1" />
            <span>Travail #{jobId}</span>
          </div>
          <span>&</span>
          <div className="flex items-center">
            <Truck className="h-4 w-4 text-[#465c50] mr-1" />
            <span>Unité #{unitId}</span>
          </div>
        </div>

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
                    alt="Aperçu" 
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
                    Supprimer
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 w-full rounded-md border border-dashed border-gray-300 bg-gray-50">
                  <Image className="h-10 w-10 text-gray-400 mb-2" />
                  <Label 
                    htmlFor="dual-photo-upload" 
                    className="cursor-pointer text-sm text-gray-600 hover:text-[#f5901d]"
                  >
                    Cliquez pour sélectionner une photo
                    <span className="block text-xs text-gray-400 mt-1">
                      JPEG, PNG, GIF, WebP (Max 5MB)
                    </span>
                  </Label>
                  <Input
                    id="dual-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="caption">Description (Optionnel)</Label>
              <Textarea
                id="caption"
                placeholder="Décrivez la photo..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="resize-none"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="client-visible">Visible par le client</Label>
                <p className="text-xs text-gray-500">
                  Activez pour rendre cette photo visible au client
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
      <CardFooter className="bg-gray-50 border-t">
        <Button 
          onClick={handleSubmit}
          disabled={isUploading || !file}
          className="w-full bg-[#f5901d] hover:bg-[#e07d0b]"
        >
          {isUploading ? "Téléversement en cours..." : "Téléverser la photo"}
        </Button>
      </CardFooter>
    </Card>
  );
}