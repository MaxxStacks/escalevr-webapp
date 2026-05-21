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
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, User, UserPlus, Edit, Trash } from "lucide-react";
import { insertUserSchema } from "@shared/schema";

// Rôles disponibles avec leurs libellés en français
const userRoles = [
  { value: "admin", label: "Administrateur" },
  { value: "service", label: "Service" },
  { value: "claim_agent", label: "Agent de réclamation" },
  { value: "technician", label: "Technicien" },
  { value: "financement", label: "Financement" },
  { value: "client", label: "Client" },
];

// Schema pour l'ajout d'un utilisateur
const addUserFormSchema = insertUserSchema.extend({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// Schema pour la modification d'un utilisateur (mot de passe optionnel)
const editUserFormSchema = insertUserSchema.extend({
  password: z.union([
    z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    z.literal('') // Permet une chaîne vide pour conserver le mot de passe actuel
  ]),
  confirmPassword: z.union([
    z.string(),
    z.literal('') // Permet une chaîne vide pour la confirmation aussi
  ]),
}).refine(data => {
  // Si password est vide, on ne vérifie pas la correspondance
  if (data.password === '') return true;
  return data.password === data.confirmPassword;
}, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type AddUserFormValues = z.infer<typeof addUserFormSchema>;
type EditUserFormValues = z.infer<typeof editUserFormSchema>;
type UserFormValues = AddUserFormValues | EditUserFormValues;

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const user = currentUser; // alias kept for existing code compatibility
  const isAdmin = currentUser?.role === "admin";
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  // Utiliser useEffect pour changer le resolver lorsque isEditMode change
  const { watch, reset, ...formMethods } = useForm<UserFormValues>({
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      role: "client",
      phone: "",
      avatarUrl: null,
    }
  });
  
  // Recréer le formulaire avec le bon schéma de validation en fonction du mode
  const form = useForm<UserFormValues>({
    ...formMethods,
    resolver: zodResolver(isEditMode ? editUserFormSchema : addUserFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      role: "client",
      phone: "",
      avatarUrl: null,
    }
  });

  // Récupération des utilisateurs
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["/api/users"],
  });

  // Mutation pour ajouter un utilisateur
  const addUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const { confirmPassword, ...userData } = data;
      const res = await apiRequest("POST", "/api/users", userData);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la création de l'utilisateur");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Utilisateur créé avec succès",
        description: "Le nouvel utilisateur a été ajouté",
      });
      setIsAddUserDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la création de l'utilisateur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation pour mettre à jour un utilisateur
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserFormValues & { id: number }) => {
      const { id, confirmPassword, ...userData } = data;
      
      // Si le mot de passe est vide, ne pas l'envoyer
      if (!userData.password) {
        delete userData.password;
      }
      
      const res = await apiRequest("PATCH", `/api/users/${id}`, userData);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la mise à jour de l'utilisateur");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Utilisateur mis à jour avec succès",
        description: "Les informations de l'utilisateur ont été mises à jour",
      });
      setSelectedUser(null);
      setIsEditMode(false);
      setIsAddUserDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la mise à jour de l'utilisateur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation pour supprimer un utilisateur
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la suppression de l'utilisateur");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Utilisateur supprimé avec succès",
        description: "L'utilisateur a été supprimé de la base de données",
      });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la suppression de l'utilisateur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filtrer les utilisateurs en fonction du terme de recherche et du rôle
  const filteredUsers = users?.filter((user: any) => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.fullName?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  // Gérer l'ajout d'utilisateur
  const handleAddUser = () => {
    form.reset({
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      role: "client",
      phone: "",
      avatarUrl: null,
    });
    setIsEditMode(false);
    setSelectedUser(null);
    setIsAddUserDialogOpen(true);
  };

  // Gérer la modification d'utilisateur
  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditMode(true);
    
    form.reset({
      username: user.username,
      password: "",
      confirmPassword: "",
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role,
      phone: user.phone || "",
      avatarUrl: user.avatarUrl,
    });
    
    setIsAddUserDialogOpen(true);
  };

  // Gérer la suppression d'utilisateur
  const handleDeleteUser = (user: any) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  };

  // Soumission du formulaire
  const onSubmit = (data: UserFormValues) => {
    if (isEditMode && selectedUser) {
      updateUserMutation.mutate({
        ...data,
        id: selectedUser.id
      });
    } else {
      addUserMutation.mutate(data);
    }
  };

  // Obtenir le libellé du rôle
  const getRoleLabel = (role: string) => {
    const found = userRoles.find(r => r.value === role);
    return found ? found.label : role;
  };

  // Obtenir la variante de badge pour le rôle
  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "admin":
        return "destructive";
      case "service":
      case "claim_agent":
        return "secondary";
      case "technician":
        return "default";
      default:
        return "outline";
    }
  };

  // Vérifier si l'utilisateur est administrateur
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

  // Afficher le chargement
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Afficher l'erreur
  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full">
          <h1 className="text-xl text-red-500">Échec de chargement des utilisateurs</h1>
          <p className="text-gray-600">Veuillez actualiser la page</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* En-tête de la page */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#465c50]">Gestion des Utilisateurs</h1>
          <p className="text-sm text-gray-600">
            Gérez tous les utilisateurs du système
          </p>
        </div>
        
        <Button 
          className="mt-4 md:mt-0 bg-[#f5901d] hover:bg-[#e07d0b]"
          onClick={handleAddUser}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Ajouter un utilisateur
        </Button>
      </div>
      
      {/* Barre de recherche + filtre par rôle */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Rechercher par nom, email, rôle..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[180px]"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">Tous les rôles</option>
          {userRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      
      {/* Tableau des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des utilisateurs</CardTitle>
          <CardDescription>
            {filteredUsers?.length || 0} utilisateurs trouvés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom d'utilisateur</TableHead>
                <TableHead>Nom complet</TableHead>
                <TableHead>Courriel</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers && filteredUsers.length > 0 ? (
                filteredUsers.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.fullName || "-"}</TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => {
                          if (user.role === "client") navigate(`/clients/${user.id}/edit`);
                          else navigate(`/staff/${user.id}/edit?role=${user.role}`);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {isAdmin && (
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user)} className="text-red-500 hover:text-red-700">
                            <Trash className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Aucun utilisateur trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Dialogue d'ajout/modification d'utilisateur */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Modifiez les informations de l'utilisateur ci-dessous." 
                : "Remplissez les informations pour créer un nouvel utilisateur."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom d'utilisateur</FormLabel>
                    <FormControl>
                      <Input placeholder="jdupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Jean Dupont" {...field} />
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
                    <FormLabel>Courriel</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jean.dupont@example.com" {...field} />
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
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input placeholder="418-555-1234" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userRoles.map(role => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditMode ? "Nouveau mot de passe (laisser vide pour conserver l'actuel)" : "Mot de passe"}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
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
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddUserDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={
                    addUserMutation.isPending || updateUserMutation.isPending
                  }
                >
                  {(addUserMutation.isPending || updateUserMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? "Mise à jour..." : "Création..."}
                    </>
                  ) : (
                    isEditMode ? "Mettre à jour" : "Créer l'utilisateur"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialogue de confirmation de suppression */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <Trash className="h-5 w-5 mr-2" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet utilisateur? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {userToDelete && (
            <div className="border rounded-md p-4 mb-4 bg-gray-50">
              <h3 className="font-medium">Utilisateur à supprimer :</h3>
              <p className="text-sm mt-1">{userToDelete.username} ({userToDelete.fullName})</p>
              <p className="text-sm text-gray-500 mt-1">Rôle: {getRoleLabel(userToDelete.role)}</p>
            </div>
          )}
          
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Supprimer définitivement"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}