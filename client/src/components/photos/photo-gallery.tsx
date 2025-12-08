import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Image as ImageIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";

interface Photo {
  id: number;
  entityType: "job" | "unit" | "claim";
  entityId: number;
  url: string;
  caption: string | null;
  uploadedBy: number;
  dateUploaded: string;
  clientVisible: boolean;
}

interface PhotoGalleryProps {
  entityType: "job" | "unit" | "claim";
  entityId: number;
}

export default function PhotoGallery({ entityType, entityId }: PhotoGalleryProps) {
  const { user } = useAuth();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data: photos, isLoading, error } = useQuery<Photo[]>({
    queryKey: [`/api/photos/${entityType}/${entityId}`],
    queryFn: async () => {
      const res = await fetch(`/api/photos/${entityType}/${entityId}`);
      if (!res.ok) throw new Error("Failed to fetch photos");
      return res.json();
    }
  });

  const isClient = user?.role === "client";

  // For clients, only show photos marked as client visible
  const visiblePhotos = showAll || isClient 
    ? photos?.filter(photo => isClient ? photo.clientVisible : true)
    : photos;

  const handleToggleVisibility = async (photoId: number, visible: boolean) => {
    try {
      const response = await fetch(`/api/photos/${photoId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientVisible: visible }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to update photo visibility');
      }
    } catch (error) {
      console.error('Error updating photo visibility:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-[#465c50]">Photos</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">Error loading photos</div>;
  }

  if (!visiblePhotos || visiblePhotos.length === 0) {
    return (
      <div className="text-center p-8 border rounded-lg bg-gray-50">
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No photos</h3>
        <p className="mt-1 text-sm text-gray-500">
          {isClient 
            ? "No photos have been shared for this item." 
            : "No photos have been uploaded for this item yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[#465c50]">Photos</h3>
        
        {!isClient && (
          <div className="flex items-center space-x-2">
            <Label htmlFor="show-all" className="text-sm text-gray-600">
              {showAll ? "Showing all photos" : "Showing client visible only"}
            </Label>
            <Switch
              id="show-all"
              checked={showAll}
              onCheckedChange={setShowAll}
            />
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visiblePhotos.map((photo) => (
          <Card key={photo.id} className="overflow-hidden group relative">
            <div 
              className="h-48 bg-gray-100 cursor-pointer"
              onClick={() => setSelectedPhoto(photo)}
            >
              <img 
                src={photo.url} 
                alt={photo.caption || "Photo"} 
                className="h-full w-full object-cover"
              />
              
              {!isClient && (
                <div className="absolute top-2 right-2">
                  <Badge 
                    className={photo.clientVisible 
                      ? "bg-green-100 text-green-800 hover:bg-green-200" 
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                    }
                  >
                    {photo.clientVisible 
                      ? <span className="flex items-center"><Eye className="w-3 h-3 mr-1" /> Client visible</span>
                      : <span className="flex items-center"><EyeOff className="w-3 h-3 mr-1" /> Hidden from client</span>
                    }
                  </Badge>
                </div>
              )}
            </div>
            
            <CardContent className="p-4">
              {photo.caption && (
                <p className="text-sm text-gray-700 line-clamp-2">{photo.caption}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {new Date(photo.dateUploaded).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Photo Detail Dialog */}
      {selectedPhoto && (
        <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-[#465c50]">
                Photo Details
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="w-full h-[50vh] bg-gray-100 rounded-md overflow-hidden">
                <img 
                  src={selectedPhoto.url} 
                  alt={selectedPhoto.caption || "Photo"} 
                  className="h-full w-full object-contain"
                />
              </div>
              
              {selectedPhoto.caption && (
                <p className="text-gray-700">{selectedPhoto.caption}</p>
              )}
              
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">
                  Uploaded on {new Date(selectedPhoto.dateUploaded).toLocaleString()}
                </p>
                
                {!isClient && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="client-visible-toggle" className="text-sm">
                      Visible to client
                    </Label>
                    <Switch
                      id="client-visible-toggle"
                      checked={selectedPhoto.clientVisible}
                      onCheckedChange={(visible) => {
                        handleToggleVisibility(selectedPhoto.id, visible);
                        setSelectedPhoto({
                          ...selectedPhoto,
                          clientVisible: visible
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}