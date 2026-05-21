import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout/layout";
import { 
  Users, 
  Loader2, 
  RefreshCw, 
  UserPlus, 
  Search, 
  Eye, 
  Edit, 
  Mail, 
  Phone, 
  User,
  ClipboardCheck
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCaption,
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
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

// Schema for adding/editing a claim agent
const agentSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional(),
  confirmPassword: z.string().optional(),
  fullName: z.string().min(2, "Le nom complet doit contenir au moins 2 caractères"),
  email: z.string().email("Veuillez entrer une adresse email valide"),
  phone: z.string().optional(),
  company: z.string().optional(),
}).refine(data => !data.password || data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type AgentFormValues = z.infer<typeof agentSchema>;

export default function ClaimAgentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isAddAgentDialogOpen, setIsAddAgentDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);

  // Form setup
  const form = useForm<AgentFormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      phone: "",
      company: "",
    }
  });

  // Only admin should access this page
  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-xl text-red-500">Accès interdit</h1>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à cette page</p>
        </div>
      </Layout>
    );
  }

  // Fetch claim agents
  const { data: claimAgents, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/users/role/claim_agent"],
  });

  // Add agent mutation
  const addAgentMutation = useMutation({
    mutationFn: async (data: AgentFormValues) => {
      // Remove confirmPassword since it's not part of the API
      const { confirmPassword, ...agentData } = data;
      
      const res = await apiRequest("POST", "/api/users", {
        ...agentData,
        role: "claim_agent"
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la création de l'agent de réclamation");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/role/claim_agent"] });
      toast({
        title: "Agent de réclamation créé avec succès",
        description: "Le nouvel agent a été ajouté",
      });
      setIsAddAgentDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la création de l'agent",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update agent mutation
  const updateAgentMutation = useMutation({
    mutationFn: async (data: AgentFormValues & { id: number }) => {
      const { confirmPassword, id, ...agentData } = data;
      
      // If password is empty, remove it from the request
      if (!agentData.password) {
        delete agentData.password;
      }
      
      const res = await apiRequest("PATCH", `/api/users/${id}`, agentData);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la mise à jour de l'agent");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/role/claim_agent"] });
      toast({
        title: "Agent mis à jour avec succès",
        description: "Les informations de l'agent ont été mises à jour",
      });
      setEditingAgent(null);
      setIsEditMode(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la mise à jour de l'agent",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter claim agents by search query
  const filteredAgents = claimAgents?.filter(
    (agent: any) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        agent.fullName?.toLowerCase().includes(query) ||
        agent.email?.toLowerCase().includes(query) ||
        agent.username?.toLowerCase().includes(query) ||
        (agent.phone && agent.phone.toLowerCase().includes(query)) ||
        (agent.company && agent.company.toLowerCase().includes(query))
      );
    }
  );

  // Handle view agent
  const handleViewAgent = (agent: any) => {
    setSelectedAgent(agent);
    setEditingAgent(null);
    setIsEditMode(false);
  };
  
  // Handle edit agent
  const handleEditAgent = (agent: any) => {
    setEditingAgent(agent);
    setIsEditMode(true);
    
    form.reset({
      username: agent.username,
      fullName: agent.fullName,
      email: agent.email,
      phone: agent.phone || "",
      company: agent.company || "",
      password: "",
      confirmPassword: "",
    });
  };
  
  // Handle add agent
  const handleAddAgent = () => {
    form.reset({
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      phone: "",
      company: "",
    });
    setIsAddAgentDialogOpen(true);
  };
  
  // Handle add agent form submission
  const onAddAgentSubmit = (data: AgentFormValues) => {
    addAgentMutation.mutate(data);
  };
  
  // Handle edit agent form submission
  const onEditAgentSubmit = (data: AgentFormValues) => {
    if (editingAgent) {
      updateAgentMutation.mutate({
        ...data,
        id: editingAgent.id
      });
    }
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsAddAgentDialogOpen(false);
    setEditingAgent(null);
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
          <h1 className="text-xl text-red-500">Échec du chargement des données</h1>
          <p className="text-gray-600">Veuillez rafraîchir la page</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#465c50]">Agents de Réclamation</h1>
          <p className="text-sm text-gray-600">
            Gérer les utilisateurs ayant le rôle "Agent de réclamation"
          </p>
        </div>
        <Button
          className="flex items-center gap-1 bg-[#f5901d] hover:bg-[#e07d0b]"
          onClick={() => navigate("/staff/new?role=claim_agent")}
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Ajouter un agent
        </Button>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Rechercher un agent..."
            className="pl-8 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Claim agents list */}
      <Card>
        <CardHeader>
          <CardTitle>Agents de Réclamation</CardTitle>
          <CardDescription>
            {filteredAgents?.length} agent(s) de réclamation dans le système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom complet</TableHead>
                <TableHead>Nom d'utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Compagnie</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAgents && filteredAgents.length > 0 ? (
                filteredAgents.map((agent: any) => (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">{agent.fullName}</TableCell>
                    <TableCell>{agent.username}</TableCell>
                    <TableCell>{agent.email}</TableCell>
                    <TableCell>{agent.phone || "-"}</TableCell>
                    <TableCell>{agent.company || "-"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" onClick={() => handleViewAgent(agent)}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Voir</span>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/staff/${agent.id}/edit?role=claim_agent`)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Modifier</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    {searchQuery ? "Aucun agent trouvé" : "Aucun agent de réclamation n'a été ajouté"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableCaption>
              Liste des agents de réclamation
            </TableCaption>
          </Table>
        </CardContent>
      </Card>

      {/* Agent Details Dialog */}
      <Dialog open={!!selectedAgent} onOpenChange={(open) => !open && setSelectedAgent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de l'agent de réclamation</DialogTitle>
          </DialogHeader>
          
          {selectedAgent && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selectedAgent.fullName}</h2>
                  <p className="text-gray-500">Agent de Réclamation</p>
                  {selectedAgent.company && (
                    <p className="text-gray-500 text-sm">{selectedAgent.company}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Email</h3>
                  <div className="mt-1 flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <p>{selectedAgent.email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Téléphone</h3>
                  <div className="mt-1 flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <p>{selectedAgent.phone || "Non fourni"}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nom d'utilisateur</h3>
                  <p className="mt-1">{selectedAgent.username}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Statut</h3>
                  <p className="mt-1 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    Actif
                  </p>
                </div>
              </div>
              
              {/* Réclamations actives */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Réclamations actives
                </h3>
                <div className="border rounded-md divide-y">
                  <div className="p-3 text-center text-gray-500">
                    Les réclamations actives seront affichées ici
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => { setSelectedAgent(null); navigate(`/staff/${selectedAgent.id}/edit?role=claim_agent`); }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier cet agent
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Agent Dialog */}
      <Dialog open={isAddAgentDialogOpen} onOpenChange={setIsAddAgentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel agent de réclamation</DialogTitle>
            <DialogDescription>
              Créer un nouveau compte d'agent de réclamation pour accéder à l'application
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddAgentSubmit)} className="space-y-4">
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
              
              <div className="grid grid-cols-2 gap-4">
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
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compagnie (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de la compagnie" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
              
              <div className="grid grid-cols-2 gap-4">
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
                      <FormLabel>Confirmer</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirmer mot de passe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#f5901d] hover:bg-[#e07d0b]"
                  disabled={addAgentMutation.isPending}
                >
                  {addAgentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer l'agent
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Agent Dialog */}
      <Dialog open={!!editingAgent} onOpenChange={(open) => !open && setEditingAgent(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'agent de réclamation</DialogTitle>
            <DialogDescription>
              Modifier les informations de l'agent de réclamation
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditAgentSubmit)} className="space-y-4">
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
              
              <div className="grid grid-cols-2 gap-4">
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
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compagnie (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="Nom de la compagnie" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
              
              <div className="grid grid-cols-2 gap-4">
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
                      <FormLabel>Confirmer</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirmer le mot de passe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[#f5901d] hover:bg-[#e07d0b]"
                  disabled={updateAgentMutation.isPending}
                >
                  {updateAgentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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