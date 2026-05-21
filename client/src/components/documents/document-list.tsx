import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, FileText, Eye, Trash2, ExternalLink, EyeOff } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  DAF: "DAF",
  PDI: "PDI",
  warranty: "Garantie",
  extended_warranty: "Garantie prolongée",
  work_order: "Bon de travail",
  inspection: "Inspection",
  contract: "Contrat",
  invoice: "Facture",
  financing: "Financement",
  other: "Autre",
};

const CATEGORY_COLORS: Record<string, string> = {
  DAF: "bg-blue-100 text-blue-700",
  PDI: "bg-green-100 text-green-700",
  warranty: "bg-purple-100 text-purple-700",
  extended_warranty: "bg-violet-100 text-violet-700",
  work_order: "bg-orange-100 text-orange-700",
  inspection: "bg-teal-100 text-teal-700",
  contract: "bg-indigo-100 text-indigo-700",
  invoice: "bg-yellow-100 text-yellow-700",
  financing: "bg-pink-100 text-pink-700",
  other: "bg-gray-100 text-gray-700",
};

interface Props {
  entityType: "unit" | "client";
  entityId: number;
}

export default function DocumentList({ entityType, entityId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewingDoc, setViewingDoc] = useState<any>(null);

  const canManage = ["admin", "service"].includes(user?.role as string);

  const { data: docs = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/documents/${entityType}/${entityId}`],
    queryFn: () =>
      apiRequest("GET", `/api/documents/${entityType}/${entityId}`).then(r => r.json()),
    enabled: !!entityId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest("DELETE", `/api/documents/${id}`).then(r => {
        if (!r.ok) throw new Error("Erreur lors de la suppression");
        return r.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${entityType}/${entityId}`] });
      toast({ title: "Document supprimé" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const visibilityMutation = useMutation({
    mutationFn: ({ id, clientVisible }: { id: number; clientVisible: boolean }) =>
      apiRequest("PATCH", `/api/documents/${id}/visibility`, { clientVisible }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${entityType}/${entityId}`] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const isPdf = (url: string) => url.toLowerCase().endsWith(".pdf");

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 rounded-md p-6 flex flex-col items-center text-gray-400 text-sm">
        <FileText className="h-8 w-8 mb-2" />
        Aucun document
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {docs.map((doc: any) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.other}`}>
                    {CATEGORY_LABELS[doc.category] || doc.category}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(doc.dateUploaded).toLocaleDateString("fr-CA")}
                  </span>
                  {doc.clientVisible && (
                    <span className="text-xs text-green-600">• Visible client</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* View */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setViewingDoc(doc)}
                title="Voir"
              >
                <Eye className="h-4 w-4" />
              </Button>

              {/* Open in new tab */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => window.open(doc.url, "_blank")}
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>

              {canManage && (
                <>
                  {/* Toggle visibility */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => visibilityMutation.mutate({ id: doc.id, clientVisible: !doc.clientVisible })}
                    title={doc.clientVisible ? "Masquer au client" : "Rendre visible au client"}
                  >
                    {doc.clientVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    onClick={() => {
                      if (confirm(`Supprimer "${doc.name}" ?`)) deleteMutation.mutate(doc.id);
                    }}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PDF Viewer Dialog */}
      <Dialog open={!!viewingDoc} onOpenChange={open => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-medium truncate pr-4">
                {viewingDoc?.name}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(viewingDoc?.url, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Ouvrir
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {viewingDoc && isPdf(viewingDoc.url) ? (
              <iframe
                src={viewingDoc.url}
                className="w-full h-full border-0"
                title={viewingDoc.name}
              />
            ) : viewingDoc ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
                <FileText className="h-16 w-16 text-gray-300" />
                <p className="text-sm">La prévisualisation n'est pas disponible pour ce type de fichier.</p>
                <Button onClick={() => window.open(viewingDoc.url, "_blank")}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Télécharger / Ouvrir
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
