import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import StatusBadge from "@/components/common/status-badge";
import PhotoUpload from "@/components/photos/photo-upload";
import DualPhotoUpload from "@/components/photos/dual-photo-upload";
import PhotoGallery from "@/components/photos/photo-gallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar, Car, User, Camera, FilePlus, Wrench } from "lucide-react";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const jobId = parseInt(id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  
  const { data: job, isLoading, error } = useQuery({
    queryKey: [`/api/jobs/${jobId}`],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) throw new Error("Failed to fetch job");
      return res.json();
    }
  });

  // Only techs, admins, and service can upload photos
  const canUploadPhotos = user && ["technician", "admin", "service"].includes(user.role);
  // Check if this is the technician assigned to this job
  const isAssignedTech = user && job && user.role === "technician" && job.technicianId === user.id;
  
  if (isLoading) {
    return (
      <div className="container py-6 space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            className="p-0 h-auto" 
            onClick={() => setLocation("/jobs")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-7 w-1/3 mb-2" />
              <Skeleton className="h-5 w-1/4" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="container py-6">
        <Button variant="ghost" onClick={() => setLocation("/jobs")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
        <div className="rounded-lg bg-red-50 p-6 mt-4 text-center">
          <h3 className="text-lg font-medium text-red-800">Error Loading Job</h3>
          <p className="mt-2 text-red-700">
            {error instanceof Error ? error.message : "Failed to load job details"}
          </p>
          <Button 
            variant="destructive" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          className="p-0 h-auto" 
          onClick={() => setLocation("/jobs")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#465c50]">
            Job #{job.jobNumber}
          </h1>
          <p className="text-gray-500">{job.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={job.status} />
          <Badge variant="outline" className="text-[#f5901d] border-[#f5901d] hover:bg-amber-50">
            {job.type.toUpperCase()}
          </Badge>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Complete information about this service job</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-2">
              <div className="rounded-full p-2 bg-[#465c50]/10">
                <Calendar className="h-5 w-5 text-[#465c50]" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Created On</h3>
                <p className="text-sm text-gray-500">
                  {new Date(job.dateCreated).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {job.dateScheduled && (
              <div className="flex items-start gap-2">
                <div className="rounded-full p-2 bg-[#465c50]/10">
                  <Clock className="h-5 w-5 text-[#465c50]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Scheduled For</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(job.dateScheduled).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            
            {job.technicianId && (
              <div className="flex items-start gap-2">
                <div className="rounded-full p-2 bg-[#465c50]/10">
                  <Wrench className="h-5 w-5 text-[#465c50]" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Assigned Technician</h3>
                  <p className="text-sm text-gray-500">
                    {job.technicianName || `Technician ID: ${job.technicianId}`}
                  </p>
                </div>
              </div>
            )}
            
            <div className="flex items-start gap-2">
              <div className="rounded-full p-2 bg-[#465c50]/10">
                <Car className="h-5 w-5 text-[#465c50]" />
              </div>
              <div>
                <h3 className="text-sm font-medium">RV Unit</h3>
                <p className="text-sm text-gray-500">
                  {job.unitMake || ""} {job.unitModel || ""} (ID: {job.unitId})
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="rounded-full p-2 bg-[#465c50]/10">
                <User className="h-5 w-5 text-[#465c50]" />
              </div>
              <div>
                <h3 className="text-sm font-medium">Client</h3>
                <p className="text-sm text-gray-500">
                  {job.clientName || `Client ID: ${job.clientId}`}
                </p>
              </div>
            </div>
          </div>
          
          {job.notes && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-line">{job.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <Tabs defaultValue="photos" className="w-full">
        <TabsList>
          <TabsTrigger value="photos" className="flex items-center gap-1">
            <Camera className="h-4 w-4" />
            Photos
          </TabsTrigger>
          <TabsTrigger value="claims" className="flex items-center gap-1">
            <FilePlus className="h-4 w-4" />
            Claims
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="photos" className="space-y-4 mt-6">
          {canUploadPhotos && (
            <div className="flex justify-end">
              {showPhotoUpload ? (
                <Button 
                  variant="outline" 
                  onClick={() => setShowPhotoUpload(false)}
                >
                  Cancel Upload
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowPhotoUpload(true)}
                  className="bg-[#f5901d] hover:bg-[#e07d0b]"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
              )}
            </div>
          )}
          
          {showPhotoUpload && (
            <div className="mb-6">
              {isAssignedTech ? (
                // Utilisation du téléversement dual pour les techniciens assignés
                <DualPhotoUpload 
                  jobId={job.id}
                  unitId={job.unitId}
                  onSuccess={() => {
                    setShowPhotoUpload(false);
                    toast({
                      title: "Photo téléversée avec succès",
                      description: "Votre photo a été ajoutée au travail et à l'unité pour référence future."
                    });
                  }}
                />
              ) : (
                // Téléversement standard pour les autres utilisateurs
                <PhotoUpload 
                  entityType="job" 
                  entityId={job.id} 
                  onSuccess={() => {
                    setShowPhotoUpload(false);
                    toast({
                      title: "Photo téléversée avec succès",
                      description: "Votre documentation photo a été enregistrée."
                    });
                  }}
                />
              )}
            </div>
          )}
          
          <PhotoGallery entityType="job" entityId={job.id} />
        </TabsContent>
        
        <TabsContent value="claims" className="space-y-4 mt-6">
          <div className="text-center p-8 border rounded-lg bg-gray-50">
            <FilePlus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No claims</h3>
            <p className="mt-1 text-sm text-gray-500">
              This job doesn't have any warranty claims.
            </p>
            {(user?.role === "claim_agent" || user?.role === "admin" || user?.role === "service") && (
              <Button 
                className="mt-4 bg-[#465c50] hover:bg-[#354940]"
                onClick={() => setLocation(`/jobs/${job.id}/claims/create`)}
              >
                <FilePlus className="mr-2 h-4 w-4" />
                Create Claim
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}