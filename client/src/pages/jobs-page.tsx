import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import StatusBadge from "@/components/common/status-badge";
import Layout from "@/components/layout/layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar, Camera, ChevronDown, Eye, Filter, Plus, Search, RefreshCw } from "lucide-react";

export default function JobsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: jobs, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/jobs"],
    queryFn: async () => {
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error("Échec de récupération des services");
      return res.json();
    }
  });

  // Filter jobs based on search and filters
  const filteredJobs = jobs?.filter((job: any) => {
    const matchesSearch = searchQuery === "" || 
      (job.jobNumber && job.jobNumber.toString().includes(searchQuery)) ||
      (job.description && job.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = typeFilter === null || job.type === typeFilter;
    const matchesStatus = statusFilter === null || job.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // French translations for job types and statuses
  const jobTypeTranslations: Record<string, string> = {
    "DAF": "DAF",
    "PDI": "PDI",
    "warranty": "Garantie",
    "insurance": "Assurance",
    "seasonal": "Saisonnier",
    "regular": "Régulier"
  };

  const jobStatusTranslations: Record<string, string> = {
    "scheduled": "Planifié",
    "in_progress": "En cours",
    "awaiting_parts": "En attente de pièces",
    "awaiting_approval": "En attente d'approbation",
    "completed": "Terminé"
  };

  const jobTypes = ["DAF", "PDI", "warranty", "insurance", "seasonal", "regular"];
  const jobStatuses = ["scheduled", "in_progress", "awaiting_parts", "awaiting_approval", "completed"];

  const LoadingContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#465c50]">Services</h1>
        <Button disabled className="bg-[#f5901d] hover:bg-[#e07d0b]">
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Service
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Liste des Services</CardTitle>
          <CardDescription>Voir et gérer les services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-10 w-full max-w-xs" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-28" />
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Photos</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-6 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ErrorContent = () => (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-[#465c50] mb-6">Services</h1>
      <div className="rounded-lg bg-red-50 p-6 text-center">
        <h3 className="text-lg font-medium text-red-800">Erreur de chargement</h3>
        <p className="mt-2 text-red-700">
          {error instanceof Error ? error.message : "Impossible de charger les services"}
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => refetch()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Réessayer
        </Button>
      </div>
    </div>
  );

  const MainContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-[#465c50]">Services</h1>
        {(user?.role === "admin" || user?.role === "service") && (
          <Button 
            onClick={() => setLocation("/travaux/nouveau")}
            className="bg-[#f5901d] hover:bg-[#e07d0b]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Service
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Liste des Services</CardTitle>
          <CardDescription>Voir et gérer les services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Rechercher services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  Type: {typeFilter ? jobTypeTranslations[typeFilter] : "Tous"}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTypeFilter(null)}>
                  Tous les types
                </DropdownMenuItem>
                {jobTypes.map((type) => (
                  <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>
                    {jobTypeTranslations[type]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-1">
                  <Filter className="h-4 w-4" />
                  Statut: {statusFilter ? jobStatusTranslations[statusFilter] : "Tous"}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                  Tous les statuts
                </DropdownMenuItem>
                {jobStatuses.map((status) => (
                  <DropdownMenuItem key={status} onClick={() => setStatusFilter(status)}>
                    {jobStatusTranslations[status]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {filteredJobs?.length === 0 ? (
            <div className="text-center p-8 border rounded-lg bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">Aucun service trouvé</h3>
              <p className="mt-1 text-gray-500">
                Essayez d'ajuster votre recherche ou vos filtres.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead>Photos</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job: any) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.jobNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[#f5901d] border-[#f5901d]">
                          {jobTypeTranslations[job.type] || job.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                        {job.description}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={job.status} />
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                          <span>{new Date(job.dateCreated).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.photoCount > 0 ? (
                          <Badge className="bg-[#465c50]">
                            <Camera className="mr-1 h-3 w-3" />
                            {job.photoCount}
                          </Badge>
                        ) : (
                          <span className="text-gray-400 text-sm">Aucune photo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLocation(`/travaux/${job.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <Layout>
      {isLoading ? <LoadingContent /> : error ? <ErrorContent /> : <MainContent />}
    </Layout>
  );
}