import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Loader2, 
  Search, 
  Plus, 
  Eye, 
  CalendarIcon, 
  BarChart3, 
  User, 
  Edit, 
  Wrench,
  Mail,
  Phone
} from "lucide-react";

// Schema for adding/editing a technician
const technicianSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional(),
  confirmPassword: z.string().optional(),
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Veuillez entrer une adresse email valide"),
  phone: z.string().optional(),
  specialization: z.string().optional(),
}).refine(data => !data.password || data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type TechnicianFormValues = z.infer<typeof technicianSchema>;

export default function TechniciansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTechnician, setSelectedTechnician] = useState<any>(null);
  const [isAddTechnicianDialogOpen, setIsAddTechnicianDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTechnician, setEditingTechnician] = useState<any>(null);
  
  // Form setup
  const form = useForm<TechnicianFormValues>({
    resolver: zodResolver(technicianSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      phone: "",
      specialization: "",
    }
  });
  
  // Fetch technicians
  const { data: technicians, isLoading, error } = useQuery({
    queryKey: ["/api/users/role/technician"],
  });
  
  // Add technician mutation
  const addTechnicianMutation = useMutation({
    mutationFn: async (data: TechnicianFormValues) => {
      // Remove confirmPassword since it's not part of the API
      const { confirmPassword, ...technicianData } = data;
      
      const res = await apiRequest("POST", "/api/users", {
        ...technicianData,
        role: "technician"
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la création du technicien");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/role/technician"] });
      toast({
        title: "Technicien créé avec succès",
        description: "Le nouveau technicien a été ajouté",
      });
      setIsAddTechnicianDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la création du technicien",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update technician mutation
  const updateTechnicianMutation = useMutation({
    mutationFn: async (data: TechnicianFormValues & { id: number }) => {
      const { confirmPassword, id, ...technicianData } = data;
      
      // If password is empty, remove it from the request
      if (!technicianData.password) {
        delete technicianData.password;
      }
      
      const res = await apiRequest("PATCH", `/api/users/${id}`, technicianData);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la mise à jour du technicien");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/role/technician"] });
      toast({
        title: "Technicien mis à jour avec succès",
        description: "Les informations du technicien ont été mises à jour",
      });
      setEditingTechnician(null);
      setIsEditMode(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la mise à jour du technicien",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Filter technicians based on search term
  const filteredTechnicians = technicians?.filter((tech: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      tech.username?.toLowerCase().includes(searchLower) ||
      tech.fullName?.toLowerCase().includes(searchLower) ||
      tech.email?.toLowerCase().includes(searchLower) ||
      (tech.phone && tech.phone.toLowerCase().includes(searchLower)) ||
      (tech.specialization && tech.specialization.toLowerCase().includes(searchLower))
    );
  });
  
  // Handle view technician
  const handleViewTechnician = (technician: any) => {
    setSelectedTechnician(technician);
    setEditingTechnician(null);
    setIsEditMode(false);
  };
  
  // Handle edit technician
  const handleEditTechnician = (technician: any) => {
    setEditingTechnician(technician);
    setIsEditMode(true);
    
    form.reset({
      username: technician.username,
      fullName: technician.fullName,
      email: technician.email,
      phone: technician.phone || "",
      specialization: technician.specialization || "",
      password: "",
      confirmPassword: "",
    });
  };
  
  // Handle add technician
  const handleAddTechnician = () => {
    form.reset({
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      phone: "",
      specialization: "",
    });
    setIsAddTechnicianDialogOpen(true);
  };
  
  // Handle add technician form submission
  const onAddTechnicianSubmit = (data: TechnicianFormValues) => {
    addTechnicianMutation.mutate(data);
  };
  
  // Handle edit technician form submission
  const onEditTechnicianSubmit = (data: TechnicianFormValues) => {
    if (editingTechnician) {
      updateTechnicianMutation.mutate({
        ...data,
        id: editingTechnician.id
      });
    }
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsAddTechnicianDialogOpen(false);
    setEditingTechnician(null);
    setIsEditMode(false);
    form.reset();
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-xl text-red-500">Échec de chargement des techniciens</h1>
          <p className="text-gray-600">Veuillez actualiser la page</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#465c50]">Techniciens</h1>
          <p className="text-sm text-gray-600">
            Gérer et consulter les informations des techniciens
          </p>
        </div>
        
        {/* Only admins and service can add new technicians */}
        {['admin', 'service'].includes(user?.role as string) && (
          <Button
            className="mt-4 md:mt-0 bg-[#f5901d] hover:bg-[#e07d0b]"
            onClick={() => navigate("/employes/nouveau?role=technician")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un technicien
          </Button>
        )}
      </div>
      
      {/* Search Bar */}
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Input
          type="text"
          placeholder="Rechercher des techniciens..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Technicians Table */}
      <Card>
        <CardHeader>
          <CardTitle>Techniciens de service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Spécialisation</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTechnicians && filteredTechnicians.length > 0 ? (
                  filteredTechnicians.map((tech: any) => (
                    <TableRow key={tech.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{tech.fullName}</TableCell>
                      <TableCell>{tech.email}</TableCell>
                      <TableCell>{tech.phone || "—"}</TableCell>
                      <TableCell>{tech.specialization || "Technicien général"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewTechnician(tech)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Voir</span>
                        </Button>
                        {['admin', 'service'].includes(user?.role as string) && (
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/employes/${tech.id}/modifier?role=technician`)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Modifier</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                      Aucun technicien trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Technician Details Dialog */}
      <Dialog open={!!selectedTechnician} onOpenChange={(open) => !open && setSelectedTechnician(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du technicien</DialogTitle>
          </DialogHeader>
          
          {selectedTechnician && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedTechnician.fullName}</h2>
                  <p className="text-gray-500">{selectedTechnician.specialization || "Technicien général"}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <div className="mt-1 flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <p>{selectedTechnician.email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Téléphone</h3>
                  <div className="mt-1 flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <p>{selectedTechnician.phone || "Non fourni"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nom d'utilisateur</h3>
                  <p className="mt-1">{selectedTechnician.username}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Statut</h3>
                  <p className="mt-1 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Disponible
                  </p>
                </div>
              </div>
              
              {/* Current Jobs */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <Wrench className="h-4 w-4 mr-2" />
                  Services en cours
                </h3>
                <div className="border rounded-md divide-y">
                  <div className="p-3 text-center text-gray-500">
                    Les services en cours seront affichés ici
                  </div>
                </div>
              </div>
              
              {/* Schedule */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Calendrier
                </h3>
                <div className="border rounded-md divide-y">
                  <div className="p-3 text-center text-gray-500">
                    Les prochains rendez-vous seront affichés ici
                  </div>
                </div>
              </div>
              
              {/* Performance Metrics */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Métriques de performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border rounded-md p-3">
                    <div className="text-sm text-gray-500">Services complétés</div>
                    <div className="text-2xl font-semibold mt-1">28</div>
                  </div>
                  <div className="border rounded-md p-3">
                    <div className="text-sm text-gray-500">Temps moyen de complétion</div>
                    <div className="text-2xl font-semibold mt-1">2,3 jours</div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                {['admin', 'service'].includes(user?.role as string) && (
                  <Button variant="outline" onClick={() => { setSelectedTechnician(null); navigate(`/employes/${selectedTechnician.id}/modifier?role=technician`); }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier ce technicien
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Technician Dialog */}
      <Dialog open={isAddTechnicianDialogOpen} onOpenChange={setIsAddTechnicianDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau technicien</DialogTitle>
            <DialogDescription>
              Créer un nouveau compte technicien pour accéder à l'application
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddTechnicianSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom complet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemple.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone (optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Numéro de téléphone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spécialisation (optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Plomberie, Électricité, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom d'utilisateur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Mot de passe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirmer le mot de passe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#f5901d] hover:bg-[#e07d0b]"
                  disabled={addTechnicianMutation.isPending}
                >
                  {addTechnicianMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le technicien
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Technician Dialog */}
      <Dialog open={!!editingTechnician} onOpenChange={(open) => !open && setEditingTechnician(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le technicien</DialogTitle>
            <DialogDescription>
              Modifier les informations du technicien
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditTechnicianSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom complet" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="email@exemple.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone (optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Numéro de téléphone" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Spécialisation (optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Plomberie, Électricité, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="Nom d'utilisateur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe (laisser vide pour ne pas changer)</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Nouveau mot de passe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirmer le mot de passe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#f5901d] hover:bg-[#e07d0b]"
                  disabled={updateTechnicianMutation.isPending}
                >
                  {updateTechnicianMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enregistrer les modifications
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
