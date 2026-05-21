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
import { Loader2, Search, Plus, Eye, Mail, Phone, Edit, Save, Trash2, User, X, FileText } from "lucide-react";
import DocumentUpload from "@/components/documents/document-upload";
import DocumentList from "@/components/documents/document-list";

// Schema for adding/editing a client
const clientSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional(),
  confirmPassword: z.string().optional(),
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Veuillez entrer une adresse email valide"),
  phone: z.string().optional(),
}).refine(data => !data.password || data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [clientTab, setClientTab] = useState<"details" | "documents">("details");
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  
  // Form setup
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      phone: "",
    }
  });
  
  // Fetch clients
  const { data: clients, isLoading, error } = useQuery({
    queryKey: ["/api/users/role/client"],
  });
  
  // Add client mutation
  const addClientMutation = useMutation({
    mutationFn: async (data: ClientFormValues) => {
      // Remove confirmPassword since it's not part of the API
      const { confirmPassword, ...clientData } = data;
      
      const res = await apiRequest("POST", "/api/users", {
        ...clientData,
        role: "client"
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la création du client");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/role/client"] });
      toast({
        title: "Client créé avec succès",
        description: "Le nouveau client a été ajouté",
      });
      setIsAddClientDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la création du client",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: ClientFormValues & { id: number }) => {
      const { confirmPassword, id, ...clientData } = data;
      
      // If password is empty, remove it from the request
      if (!clientData.password) {
        delete clientData.password;
      }
      
      const res = await apiRequest("PATCH", `/api/users/${id}`, clientData);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la mise à jour du client");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/role/client"] });
      toast({
        title: "Client mis à jour avec succès",
        description: "Les informations du client ont été mises à jour",
      });
      setEditingClient(null);
      setIsEditMode(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la mise à jour du client",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Filter clients based on search term
  const filteredClients = clients?.filter((client: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      client.username?.toLowerCase().includes(searchLower) ||
      client.fullName?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      (client.phone && client.phone.toLowerCase().includes(searchLower))
    );
  });
  
  // Handle view client
  const handleViewClient = (client: any) => {
    setSelectedClient(client);
    setClientTab("details");
    setEditingClient(null);
    setIsEditMode(false);
  };
  
  // Handle edit client
  const handleEditClient = (client: any) => {
    setEditingClient(client);
    setIsEditMode(true);
    
    form.reset({
      username: client.username,
      fullName: client.fullName,
      email: client.email,
      phone: client.phone || "",
      password: "",
      confirmPassword: "",
    });
  };
  
  // Handle add client
  const handleAddClient = () => {
    form.reset({
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      phone: "",
    });
    setIsAddClientDialogOpen(true);
  };
  
  // Handle add client form submission
  const onAddClientSubmit = (data: ClientFormValues) => {
    addClientMutation.mutate(data);
  };
  
  // Handle edit client form submission
  const onEditClientSubmit = (data: ClientFormValues) => {
    if (editingClient) {
      updateClientMutation.mutate({
        ...data,
        id: editingClient.id
      });
    }
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsAddClientDialogOpen(false);
    setEditingClient(null);
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
          <h1 className="text-xl text-red-500">Échec de chargement des clients</h1>
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
          <h1 className="text-2xl font-bold text-[#465c50]">Clients</h1>
          <p className="text-sm text-gray-600">
            Gérer et consulter les informations des clients
          </p>
        </div>
        
        {/* Only admins and service can add new clients */}
        {['admin', 'service'].includes(user?.role as string) && (
          <Button
            className="mt-4 md:mt-0 bg-[#f5901d] hover:bg-[#e07d0b]"
            onClick={() => navigate("/clients/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un client
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
          placeholder="Rechercher des clients..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients enregistrés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Nom d'utilisateur</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients && filteredClients.length > 0 ? (
                  filteredClients.map((client: any) => (
                    <TableRow key={client.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{client.fullName}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone || "—"}</TableCell>
                      <TableCell>{client.username}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewClient(client)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">Voir</span>
                        </Button>
                        {['admin', 'service'].includes(user?.role as string) && (
                          <Button variant="ghost" size="sm" onClick={() => navigate(`/clients/${client.id}/edit`)}>
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
                      Aucun client trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Client Details Dialog */}
      <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedClient?.fullName || "Détails du client"}</DialogTitle>
          </DialogHeader>

          {selectedClient && (
            <>
              {/* Tab bar */}
              <div className="flex border-b -mx-1">
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${clientTab === "details" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setClientTab("details")}
                >
                  <User className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                  Détails
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${clientTab === "documents" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setClientTab("documents")}
                >
                  <FileText className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                  Documents
                </button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-4 py-2">
                {clientTab === "details" && (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <User className="h-7 w-7 text-gray-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold">{selectedClient.fullName}</h2>
                        <p className="text-sm text-gray-500">{selectedClient.username}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 mb-0.5">Email</p>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{selectedClient.email}</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 mb-0.5">Téléphone</p>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{selectedClient.phone || "Non fourni"}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {clientTab === "documents" && (
                  <div className="space-y-4">
                    <DocumentUpload
                      entityType="client"
                      entityId={selectedClient.id}
                      onSuccess={() => {}}
                    />
                    <DocumentList entityType="client" entityId={selectedClient.id} />
                  </div>
                )}
              </div>

              <DialogFooter className="pt-2 border-t">
                {['admin', 'service'].includes(user?.role as string) && (
                  <Button variant="outline" onClick={() => { setSelectedClient(null); navigate(`/clients/${selectedClient.id}/edit`); }}>
                    <Edit className="h-4 w-4 mr-2" /> Modifier ce client
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Client Dialog */}
      <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau client</DialogTitle>
            <DialogDescription>
              Créer un nouveau compte client pour accéder à l'application
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddClientSubmit)} className="space-y-4">
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
                  disabled={addClientMutation.isPending}
                >
                  {addClientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le client
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Client Dialog */}
      <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le client</DialogTitle>
            <DialogDescription>
              Modifier les informations du client
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditClientSubmit)} className="space-y-4">
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
                  disabled={updateClientMutation.isPending}
                >
                  {updateClientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
