import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Search, Plus, Eye, Image, Car, Edit, Trash2, AlertTriangle, FileText } from "lucide-react";
import DocumentUpload from "@/components/documents/document-upload";
import DocumentList from "@/components/documents/document-list";


export default function UnitsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showUnitDialog, setShowUnitDialog] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<any>(null);
  const [unitTab, setUnitTab] = useState<"details" | "documents">("details");

  // Fetch units
  const { data: units, isLoading, error } = useQuery({
    queryKey: ["/api/units"],
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
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<any>(null);

  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: number) => {
      const res = await apiRequest("DELETE", `/api/units/${unitId}`);
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Erreur"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({ title: "Véhicule supprimé avec succès" });
      setShowUnitDialog(false); setSelectedUnit(null);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const handleViewUnit = (unit: any) => { setSelectedUnit(unit); setShowUnitDialog(true); setUnitTab("details"); };
  const handleDeleteUnit = (unit: any) => { setUnitToDelete(unit); setShowDeleteConfirm(true); };
  const confirmDeleteUnit = () => {
    if (unitToDelete) { deleteUnitMutation.mutate(unitToDelete.id); setShowDeleteConfirm(false); setUnitToDelete(null); }
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
        
        {['admin', 'service'].includes(user?.role as string) && (
          <Button className="mt-4 md:mt-0 bg-[#f5901d] hover:bg-[#e07d0b]" onClick={() => navigate("/units/new")}>
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
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/units/${unit.id}/edit`)}>
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedUnit ? `${selectedUnit.year} ${selectedUnit.make} ${selectedUnit.model}` : "Détails du véhicule"}
            </DialogTitle>
          </DialogHeader>

          {selectedUnit && (
            <>
              {/* Tab bar */}
              <div className="flex border-b -mx-1">
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${unitTab === "details" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setUnitTab("details")}
                >
                  <Image className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                  Détails
                </button>
                <button
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${unitTab === "documents" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                  onClick={() => setUnitTab("documents")}
                >
                  <FileText className="h-4 w-4 inline mr-1.5 -mt-0.5" />
                  Documents
                </button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-4 py-2">
                {unitTab === "details" && (
                  <>
                    {/* Photos */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Photos</h3>
                      {selectedUnit.photos && selectedUnit.photos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {selectedUnit.photos.map((photo: any, index: number) => (
                            <div key={index} className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                              <img src={photo.url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="border border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center text-gray-400">
                          <Image className="h-8 w-8 mb-2" />
                          <p className="text-sm">Aucune photo disponible</p>
                        </div>
                      )}
                    </div>

                    {/* Unit info grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">NIV</p>
                        <p className="font-mono mt-0.5">{selectedUnit.vin}</p>
                      </div>
                      {selectedUnit.shortVin && (
                        <div>
                          <p className="text-gray-500">NIV court</p>
                          <p className="font-mono mt-0.5">{selectedUnit.shortVin}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-500">Ajouté le</p>
                        <p className="mt-0.5">{new Date(selectedUnit.dateAdded).toLocaleDateString("fr-CA")}</p>
                      </div>
                      {selectedUnit.color && (
                        <div>
                          <p className="text-gray-500">Couleur</p>
                          <p className="mt-0.5">{selectedUnit.color}</p>
                        </div>
                      )}
                    </div>

                    {selectedUnit.notes && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                        <p className="mt-1 text-sm text-gray-700">{selectedUnit.notes}</p>
                      </div>
                    )}
                  </>
                )}

                {unitTab === "documents" && (
                  <div className="space-y-4">
                    <DocumentUpload
                      entityType="unit"
                      entityId={selectedUnit.id}
                      onSuccess={() => {}}
                    />
                    <DocumentList entityType="unit" entityId={selectedUnit.id} />
                  </div>
                )}
              </div>

              <DialogFooter className="flex justify-between pt-2 border-t">
                {['admin', 'service'].includes(user?.role as string) && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setShowUnitDialog(false); navigate(`/units/${selectedUnit.id}/edit`); }}>
                      <Edit className="h-4 w-4 mr-2" /> Modifier
                    </Button>
                    {user?.role === 'admin' && (
                      <Button variant="destructive" onClick={() => handleDeleteUnit(selectedUnit)}>
                        <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                      </Button>
                    )}
                  </div>
                )}
              </DialogFooter>
            </>
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
    </Layout>
  );
}