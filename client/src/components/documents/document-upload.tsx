import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Loader2, FileText } from "lucide-react";

const UNIT_CATEGORIES = [
  { value: "DAF", label: "DAF" },
  { value: "PDI", label: "PDI" },
  { value: "warranty", label: "Garantie" },
  { value: "extended_warranty", label: "Garantie prolongée" },
  { value: "work_order", label: "Bon de travail" },
  { value: "inspection", label: "Inspection" },
  { value: "other", label: "Autre" },
];

const CLIENT_CATEGORIES = [
  { value: "contract", label: "Contrat" },
  { value: "invoice", label: "Facture" },
  { value: "work_order", label: "Bon de travail" },
  { value: "financing", label: "Financement" },
  { value: "other", label: "Autre" },
];

interface Props {
  entityType: "unit" | "client";
  entityId: number;
  onSuccess: () => void;
}

export default function DocumentUpload({ entityType, entityId, onSuccess }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const categories = entityType === "unit" ? UNIT_CATEGORIES : CLIENT_CATEGORIES;

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(categories[0].value);
  const [clientVisible, setClientVisible] = useState(false);

  const canManage = ["admin", "service"].includes(user?.role as string);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Aucun fichier sélectionné");
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", entityType);
      fd.append("entityId", String(entityId));
      fd.append("category", category);
      fd.append("name", name || file.name);
      fd.append("clientVisible", String(clientVisible));

      const res = await fetch("/api/documents", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erreur lors du téléversement");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${entityType}/${entityId}`] });
      toast({ title: "Document téléversé avec succès" });
      setFile(null);
      setName("");
      setCategory(categories[0].value);
      setClientVisible(false);
      if (fileRef.current) fileRef.current.value = "";
      onSuccess();
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  if (!canManage) return null;

  return (
    <div className="border border-dashed border-gray-300 rounded-md p-4 space-y-3 bg-gray-50">
      <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
        <Upload className="h-4 w-4" /> Ajouter un document
      </p>

      {/* File picker */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0] || null;
            setFile(f);
            if (f && !name) setName(f.name.replace(/\.[^.]+$/, ""));
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          className="w-full"
        >
          <FileText className="h-4 w-4 mr-2" />
          {file ? file.name : "Choisir un fichier PDF ou Word"}
        </Button>
      </div>

      {file && (
        <>
          {/* Document name */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Nom du document</label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nom du document"
              className="h-8 text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-gray-500 block mb-1">Catégorie</label>
            <select
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              {categories.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Client visibility */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={clientVisible}
              onChange={e => setClientVisible(e.target.checked)}
              className="rounded"
            />
            Visible par le client
          </label>

          {/* Upload button */}
          <Button
            type="button"
            className="w-full bg-[#f5901d] hover:bg-[#e07d0b]"
            size="sm"
            disabled={uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
          >
            {uploadMutation.isPending
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Téléversement...</>
              : <><Upload className="h-4 w-4 mr-2" />Téléverser</>}
          </Button>
        </>
      )}
    </div>
  );
}
