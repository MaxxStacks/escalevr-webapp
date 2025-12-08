import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  UserPlus, 
  Users,
  Loader2,
  PencilLine,
  CheckCircle,
  XCircle,
  RefreshCw
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

// French translations
const translations = {
  "User Groups": "Groupes d'utilisateurs",
  "Manage user groups and roles": "Gérer les groupes d'utilisateurs et les rôles",
  "Create Group": "Créer un groupe",
  "Add User": "Ajouter un utilisateur",
  "Name": "Nom",
  "Description": "Description",
  "Role": "Rôle",
  "Actions": "Actions",
  "Edit": "Modifier",
  "Delete": "Supprimer",
  "Members": "Membres",
  "No groups found": "Aucun groupe trouvé",
  "Add New Group": "Ajouter un nouveau groupe",
  "Group Name": "Nom du groupe",
  "Group Description": "Description du groupe",
  "Group Role": "Rôle du groupe",
  "Save": "Enregistrer",
  "Cancel": "Annuler",
  "Admin": "Administrateur",
  "Service": "Service",
  "Claim Agent": "Agent de réclamation",
  "Technician": "Technicien",
  "Client": "Client",
  "Refreshing...": "Actualisation...",
  "Group updated successfully": "Groupe mis à jour avec succès",
  "Group created successfully": "Groupe créé avec succès",
  "Failed to create group": "Échec de la création du groupe",
  "Failed to update group": "Échec de la mise à jour du groupe"
};

// Roles available in the system
const userRoles = [
  { value: "admin", label: translations["Admin"] },
  { value: "service", label: translations["Service"] },
  { value: "claim_agent", label: translations["Claim Agent"] },
  { value: "technician", label: translations["Technician"] },
  { value: "client", label: translations["Client"] }
];

// Define schema for creating/editing a group
const groupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  role: z.string().min(1, "Role is required")
});

type GroupFormValues = z.infer<typeof groupSchema>;

export default function UserGroupsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Only admin can access this page
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

  // Fetch user groups
  const { data: groups, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/user-groups"],
    queryFn: () => {
      // For demo purposes, we'll create mock data
      // In a real application, this would be an API call
      return [
        {
          id: 1,
          name: "Administrateurs",
          description: "Droits complets sur le système",
          role: "admin",
          memberCount: 1
        },
        {
          id: 2,
          name: "Techniciens",
          description: "Accès au service technique",
          role: "technician",
          memberCount: 1
        }
      ];
    }
  });

  // Form for adding/editing groups
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: "",
      description: "",
      role: "service" // Default to service role
    }
  });

  // Reset form when dialog opens
  const openAddDialog = () => {
    form.reset({
      name: "",
      description: "",
      role: "service"
    });
    setSelectedGroup(null);
    setIsAddDialogOpen(true);
  };

  // Edit a group
  const editGroup = (group: any) => {
    form.reset({
      name: group.name,
      description: group.description || "",
      role: group.role
    });
    setSelectedGroup(group);
    setIsAddDialogOpen(true);
  };

  // Create new group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: GroupFormValues) => {
      // In a real application, this would be an API call
      console.log("Creating group:", data);
      return { id: Date.now(), ...data, memberCount: 0 };
    },
    onSuccess: () => {
      refetch();
      setIsAddDialogOpen(false);
      toast({
        title: translations["Group created successfully"],
        description: `Le groupe "${form.getValues().name}" a été créé avec succès.`,
      });
    },
    onError: (error) => {
      toast({
        title: translations["Failed to create group"],
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update group mutation
  const updateGroupMutation = useMutation({
    mutationFn: async (data: GroupFormValues & { id: number }) => {
      // In a real application, this would be an API call
      console.log("Updating group:", data);
      return data;
    },
    onSuccess: () => {
      refetch();
      setIsAddDialogOpen(false);
      toast({
        title: translations["Group updated successfully"],
        description: `Le groupe "${form.getValues().name}" a été mis à jour avec succès.`,
      });
    },
    onError: (error) => {
      toast({
        title: translations["Failed to update group"],
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Submit handler
  const onSubmit = (data: GroupFormValues) => {
    if (selectedGroup) {
      updateGroupMutation.mutate({ ...data, id: selectedGroup.id });
    } else {
      createGroupMutation.mutate(data);
    }
  };

  // UI for loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // UI for error state
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

  // Get role label
  const getRoleLabel = (role: string) => {
    const roleObj = userRoles.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  // Get role badge color
  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "admin":
        return "destructive";
      case "service":
        return "secondary";
      case "claim_agent":
        return "secondary";
      case "technician":
        return "default";
      default:
        return "outline";
    }
  };

  return (
    <Layout>
      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{translations["User Groups"]}</h1>
          <p className="text-muted-foreground mt-1">{translations["Manage user groups and roles"]}</p>
        </div>
        <Button onClick={openAddDialog} className="flex items-center gap-1">
          <UserPlus className="h-4 w-4 mr-1" />
          {translations["Add New Group"]}
        </Button>
      </div>

      {/* Groups list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{translations["User Groups"]}</CardTitle>
          <CardDescription>
            {groups?.length} groupes d'utilisateurs configurés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{translations["Name"]}</TableHead>
                <TableHead>{translations["Description"]}</TableHead>
                <TableHead>{translations["Role"]}</TableHead>
                <TableHead>{translations["Members"]}</TableHead>
                <TableHead className="text-right">{translations["Actions"]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups && groups.length > 0 ? (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.description || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(group.role)}>
                        {getRoleLabel(group.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/50">
                        {group.memberCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => editGroup(group)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <PencilLine className="h-4 w-4" />
                      </Button>
                      {/* We don't add delete functionality for the demo */}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    {translations["No groups found"]}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog for adding/editing groups */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedGroup ? `Modifier ${selectedGroup.name}` : translations["Add New Group"]}
            </DialogTitle>
            <DialogDescription>
              {selectedGroup
                ? "Modifiez les détails du groupe d'utilisateurs."
                : "Créez un nouveau groupe d'utilisateurs avec un rôle spécifique."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations["Group Name"]}</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Services techniques" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{translations["Group Description"]}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Personnel de service technique"
                        {...field}
                        value={field.value || ""}
                      />
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
                    <FormLabel>{translations["Role"]}</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        {userRoles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="mr-2"
                >
                  {translations["Cancel"]}
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createGroupMutation.isPending || updateGroupMutation.isPending
                  }
                >
                  {(createGroupMutation.isPending || updateGroupMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {translations["Refreshing..."]}
                    </>
                  ) : (
                    translations["Save"]
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}