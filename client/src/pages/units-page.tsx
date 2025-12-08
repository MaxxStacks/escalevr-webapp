import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
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
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Search, Plus, Eye, Image, Car, Edit, Trash2, AlertTriangle } from "lucide-react";

// Schema for adding/editing a unit
const unitSchema = z.object({
  year: z.coerce.number()
    .int("L'année doit être un nombre entier")
    .min(1900, "L'année doit être supérieure à 1900")
    .max(new Date().getFullYear() + 1, `L'année ne peut pas dépasser ${new Date().getFullYear() + 1}`),
  make: z.string().min(2, "La marque doit contenir au moins 2 caractères"),
  model: z.string().min(2, "Le modèle doit contenir au moins 2 caractères"),
  vin: z.string().min(6, "Le NIV doit contenir au moins 6 caractères"),
  shortVin: z.string().optional(),
  clientId: z.coerce.number().optional(),
  notes: z.string().optional(),
});

type UnitFormValues = z.infer<typeof unitSchema>;

export default function UnitsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [isAddUnitDialogOpen, setIsAddUnitDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  
  // Form setup
  const form = useForm<UnitFormValues>({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      year: new Date().getFullYear(),
      make: "",
      model: "",
      vin: "",
      shortVin: "",
      notes: "",
    }
  });
  
  // Fetch units
  const { data: units, isLoading, error } = useQuery({
    queryKey: ["/api/units"],
  });
  
  // Fetch clients for dropdown
  const { data: clients } = useQuery({
    queryKey: ["/api/users/role/client"],
    enabled: ['admin', 'service'].includes(user?.role as string)
  });
  
  // Add unit mutation
  const addUnitMutation = useMutation({
    mutationFn: async (data: UnitFormValues) => {
      const res = await apiRequest("POST", "/api/units", {
        ...data,
        dateAdded: new Date().toISOString(),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la création du véhicule");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({
        title: "Véhicule créé avec succès",
        description: "Le nouveau véhicule a été ajouté",
      });
      setIsAddUnitDialogOpen(false);
      form.reset({
        year: new Date().getFullYear(),
        make: "",
        model: "",
        vin: "",
        shortVin: "",
        notes: "",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la création du véhicule",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update unit mutation
  const updateUnitMutation = useMutation({
    mutationFn: async (data: UnitFormValues & { id: number }) => {
      const { id, ...unitData } = data;
      
      const res = await apiRequest("PATCH", `/api/units/${id}`, unitData);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la mise à jour du véhicule");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({
        title: "Véhicule mis à jour avec succès",
        description: "Les informations du véhicule ont été mises à jour",
      });
      setEditingUnit(null);
      setIsEditMode(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la mise à jour du véhicule",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete unit mutation - admin only
  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: number) => {
      const res = await apiRequest("DELETE", `/api/units/${unitId}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de la suppression du véhicule");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({
        title: "Véhicule supprimé avec succès",
        description: "Le véhicule a été supprimé de la base de données",
      });
      setShowUnitDialog(false);
      setSelectedUnit(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la suppression du véhicule",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Filter units based on search term
  const filteredUnits = units?.filter((unit: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      unit.make?.toLowerCase().includes(searchLower) ||
      unit.model?.toLowerCase().includes(searchLower) ||
      unit.vin?.toLowerCase().includes(searchLower) ||
      (unit.shortVin && unit.shortVin.toLowerCase().includes(searchLower)) ||
      unit.year?.toString().includes(searchLower)
    );
  });
  
  // Handle view unit
  const handleViewUnit = (unit: any) => {
    setSelectedUnit(unit);
    setShowUnitDialog(true);
  };
  
  // Handle add unit
  const handleAddUnit = () => {
    form.reset({
      year: new Date().getFullYear(),
      make: "",
      model: "",
      vin: "",
      shortVin: "",
      notes: "",
    });
    setIsAddUnitDialogOpen(true);
  };
  
  // Handle edit unit
  const handleEditUnit = (unit: any) => {
    setEditingUnit(unit);
    setIsEditMode(true);
    
    form.reset({
      year: unit.year,
      make: unit.make,
      model: unit.model,
      vin: unit.vin,
      shortVin: unit.shortVin || "",
      clientId: unit.clientId,
      notes: unit.notes || "",
    });
  };
  
  // Handle delete unit - admin only
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<any>(null);
  
  const handleDeleteUnit = (unit: any) => {
    setUnitToDelete(unit);
    setShowDeleteConfirm(true);
  };
  
  const confirmDeleteUnit = () => {
    if (unitToDelete) {
      deleteUnitMutation.mutate(unitToDelete.id);
      setShowDeleteConfirm(false);
      setUnitToDelete(null);
    }
  };
  
  // Handle add unit form submission
  const onAddUnitSubmit = (data: UnitFormValues) => {
    addUnitMutation.mutate(data);
  };
  
  // Handle edit unit form submission
  const onEditUnitSubmit = (data: UnitFormValues) => {
    if (editingUnit) {
      updateUnitMutation.mutate({
        ...data,
        id: editingUnit.id
      });
    }
  };
  
  // Handle dialog close
  const handleDialogClose = () => {
    setIsAddUnitDialogOpen(false);
    setEditingUnit(null);
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
          <h1 className="text-xl text-red-500">Échec de chargement des véhicules</h1>
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
          <h1 className="text-2xl font-bold text-[#465c50]">Véhicules</h1>
          <p className="text-sm text-gray-600">
            {user?.role === 'client' ? 'Vos véhicules récréatifs' : 'Tous les véhicules récréatifs'}
          </p>
        </div>
        
        {/* Admin and Service can add new units */}
        {['admin', 'service'].includes(user?.role as string) && (
          <Button 
            className="mt-4 md:mt-0 bg-[#f5901d] hover:bg-[#e07d0b]"
            onClick={handleAddUnit}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un véhicule
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
          placeholder="Rechercher par marque, modèle, NIV..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      {/* Units Grid */}
      {filteredUnits && filteredUnits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUnits.map((unit: any) => (
            <Card key={unit.id} className="overflow-hidden">
              <div className="h-40 bg-gray-100 relative flex items-center justify-center">
                {unit.photos && unit.photos.length > 0 ? (
                  <img 
                    src={unit.photos[0].url} 
                    alt={`${unit.year} ${unit.make} ${unit.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Car className="h-20 w-20 text-gray-300" />
                )}
              </div>
              <CardHeader>
                <CardTitle>{unit.year} {unit.make} {unit.model}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">NIV:</span>
                    <span className="font-medium">{unit.vin}</span>
                  </div>
                  {unit.shortVin && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">NIV court:</span>
                      <span className="font-medium">{unit.shortVin}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ajouté le:</span>
                    <span>{new Date(unit.dateAdded).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => handleViewUnit(unit)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </Button>
                {['admin', 'service'].includes(user?.role as string) && (
                  <Button variant="ghost" size="sm" onClick={() => handleEditUnit(unit)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="flex justify-center mb-4">
            <Car className="h-16 w-16 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun véhicule trouvé</h3>
          <p className="text-gray-500">
            {searchTerm
              ? `Aucun véhicule correspondant à "${searchTerm}"`
              : "Aucun véhicule récréatif n'a été enregistré"}
          </p>
        </div>
      )}
      
      {/* Unit Details Dialog */}
      <Dialog open={showUnitDialog} onOpenChange={setShowUnitDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du véhicule</DialogTitle>
          </DialogHeader>
          
          {selectedUnit && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">
                {selectedUnit.year} {selectedUnit.make} {selectedUnit.model}
              </h2>
              
              {/* Unit Photos */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Photos</h3>
                {selectedUnit.photos && selectedUnit.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {selectedUnit.photos.map((photo: any, index: number) => (
                      <div key={index} className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                        <img 
                          src={photo.url} 
                          alt={`Photo véhicule ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-dashed border-gray-300 rounded-md p-8 flex flex-col items-center justify-center text-gray-500">
                    <Image className="h-8 w-8 mb-2" />
                    <p>Aucune photo disponible</p>
                  </div>
                )}
              </div>
              
              {/* Unit Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">NIV</h3>
                  <p className="mt-1 font-mono">{selectedUnit.vin}</p>
                </div>
                {selectedUnit.shortVin && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">NIV court</h3>
                    <p className="mt-1 font-mono">{selectedUnit.shortVin}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ajouté le</h3>
                  <p className="mt-1">{new Date(selectedUnit.dateAdded).toLocaleDateString()}</p>
                </div>
              </div>
              
              {/* Notes */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                <p className="mt-1 text-gray-700">
                  {selectedUnit.notes || "Aucune note disponible pour ce véhicule."}
                </p>
              </div>
              
              {/* Service History - could be implemented with an additional API call */}
              <div>
                <h3 className="text-sm font-medium text-gray-500">Historique des services</h3>
                <div className="mt-2 border rounded-md divide-y">
                  <div className="p-3 text-center text-gray-500">
                    L'historique des services sera affiché ici
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex justify-between">
                {['admin', 'service'].includes(user?.role as string) && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => {
                      setShowUnitDialog(false);
                      handleEditUnit(selectedUnit);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Modifier
                    </Button>
                    
                    {/* Bouton de suppression - Admin uniquement */}
                    {user?.role === 'admin' && (
                      <Button 
                        variant="destructive" 
                        onClick={() => handleDeleteUnit(selectedUnit)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Supprimer
                      </Button>
                    )}
                  </div>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer ce véhicule? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {unitToDelete && (
            <div className="border rounded-md p-4 mb-4 bg-gray-50">
              <h3 className="font-medium">Véhicule à supprimer :</h3>
              <p className="text-sm mt-1">{unitToDelete.year} {unitToDelete.make} {unitToDelete.model}</p>
              <p className="text-sm text-gray-500 mt-1">NIV: {unitToDelete.vin}</p>
            </div>
          )}
          
          <DialogFooter className="flex space-x-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUnit}
              disabled={deleteUnitMutation.isPending}
            >
              {deleteUnitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                "Confirmer la suppression"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  
      {/* Add Unit Dialog */}
      <Dialog open={isAddUnitDialogOpen} onOpenChange={setIsAddUnitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau véhicule</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour enregistrer un nouveau véhicule
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddUnitSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Année</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2023" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        >
                          <option value="">Sélectionnez un client</option>
                          {clients?.map((client: any) => (
                            <option key={client.id} value={client.id}>
                              {client.fullName}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marque</FormLabel>
                      <FormControl>
                        <Input placeholder="Marque" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modèle</FormLabel>
                      <FormControl>
                        <Input placeholder="Modèle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIV (Numéro d'identification du véhicule)</FormLabel>
                      <FormControl>
                        <Input placeholder="NIV complet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="shortVin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIV court (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="NIV court" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notes additionnelles" {...field} rows={3} />
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
                  disabled={addUnitMutation.isPending}
                >
                  {addUnitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le véhicule
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Unit Dialog */}
      <Dialog open={!!editingUnit} onOpenChange={(open) => !open && setEditingUnit(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le véhicule</DialogTitle>
            <DialogDescription>
              Modifier les informations du véhicule
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditUnitSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Année</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="2023" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <FormControl>
                        <select 
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                        >
                          <option value="">Sélectionnez un client</option>
                          {clients?.map((client: any) => (
                            <option key={client.id} value={client.id}>
                              {client.fullName}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marque</FormLabel>
                      <FormControl>
                        <Input placeholder="Marque" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modèle</FormLabel>
                      <FormControl>
                        <Input placeholder="Modèle" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIV (Numéro d'identification du véhicule)</FormLabel>
                      <FormControl>
                        <Input placeholder="NIV complet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="shortVin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIV court (optionnel)</FormLabel>
                      <FormControl>
                        <Input placeholder="NIV court" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notes additionnelles" {...field} rows={3} />
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
                  disabled={updateUnitMutation.isPending}
                >
                  {updateUnitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
