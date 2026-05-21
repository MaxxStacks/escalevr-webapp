import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const MAKES: Record<string, string[]> = {
  "Keystone RV":        ["Aspen Trail", "Colorado", "Cougar", "Montana", "Sprinter"],
  "Forest River":       ["Shasta", "Palomino", "Sabre", "Flagstaff", "Rockwood"],
  "Heartland RV":       ["Prowler", "Bighorn", "Cyclone", "Pioneer", "Trail Runner"],
  "Columbia Northwest": ["Aliner", "Aliner Classic", "Aliner Ranger"],
  "Midwest Automotive": ["Irok"],
};

const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2009 }, (_, i) => currentYear - i);

const emptyClient = {
  firstName: "", lastName: "", email: "", homePhone: "", workPhone: "",
  address: "", city: "", province: "", postalCode: "",
  coOwnerFirstName: "", coOwnerLastName: "", coOwnerEmail: "",
  coOwnerPhone: "", coOwnerWorkPhone: "",
};

export default function UnitFormPage() {
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const isEdit = !!params.id;
  const { toast } = useToast();

  const [clientMode, setClientMode] = useState<"select" | "create">("select");
  const [hasCoOwner, setHasCoOwner] = useState(false);
  const [hasExtendedWarranty, setHasExtendedWarranty] = useState(false);

  const [form, setForm] = useState({
    year: String(currentYear),
    make: "",
    model: "",
    vin: "",
    shortVin: "",
    color: "",
    internalUnitNumber: "",
    activationDate: "",
    saleDate: "",
    baseWarrantyDate: "",
    warrantyDate: "",
    extendedWarrantyStart: "",
    extendedWarrantyEnd: "",
    notes: "",
    clientId: "",
  });

  const [newClient, setNewClient] = useState(emptyClient);

  const { data: unit, isLoading: unitLoading } = useQuery<any>({
    queryKey: [`/api/units/${params.id}`],
    enabled: isEdit,
  });

  const { data: clients = [] } = useQuery<any[]>({ queryKey: ["/api/users/role/client"] });

  useEffect(() => {
    if (unit) {
      setForm({
        year: String(unit.year),
        make: unit.make || "",
        model: unit.model || "",
        vin: unit.vin || "",
        shortVin: unit.shortVin || "",
        color: unit.color || "",
        internalUnitNumber: unit.internalUnitNumber || "",
        activationDate: unit.activationDate ? unit.activationDate.split("T")[0] : "",
        saleDate: unit.saleDate ? unit.saleDate.split("T")[0] : "",
        baseWarrantyDate: unit.baseWarrantyDate ? unit.baseWarrantyDate.split("T")[0] : "",
        warrantyDate: unit.warrantyDate ? unit.warrantyDate.split("T")[0] : "",
        extendedWarrantyStart: unit.extendedWarrantyStart ? unit.extendedWarrantyStart.split("T")[0] : "",
        extendedWarrantyEnd: unit.extendedWarrantyEnd ? unit.extendedWarrantyEnd.split("T")[0] : "",
        notes: unit.notes || "",
        clientId: String(unit.clientId || ""),
      });
      setHasExtendedWarranty(!!unit.extendedWarranty);
    }
  }, [unit]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let clientId = form.clientId ? Number(form.clientId) : null;

      if (clientMode === "create") {
        const clientRes = await apiRequest("POST", "/api/register", {
          username: newClient.email.toLowerCase().replace(/[^a-z0-9]/g, ""),
          password: Math.random().toString(36).slice(-8),
          fullName: `${newClient.firstName} ${newClient.lastName}`,
          email: newClient.email,
          role: "client",
          phone: newClient.homePhone,
          workPhone: newClient.workPhone,
          address: newClient.address,
          city: newClient.city,
          province: newClient.province,
          postalCode: newClient.postalCode,
          coOwnerFirstName: newClient.coOwnerFirstName || null,
          coOwnerLastName: newClient.coOwnerLastName || null,
          coOwnerEmail: newClient.coOwnerEmail || null,
          coOwnerPhone: newClient.coOwnerPhone || null,
          coOwnerWorkPhone: newClient.coOwnerWorkPhone || null,
        });
        if (!clientRes.ok) throw new Error("Erreur lors de la création du client");
        const created = await clientRes.json();
        clientId = created.id;
      }

      if (!clientId) throw new Error("Veuillez sélectionner ou créer un client");

      const payload: any = {
        year: Number(form.year),
        make: form.make,
        model: form.model,
        vin: form.vin,
        shortVin: form.shortVin || null,
        color: form.color || null,
        clientId,
        internalUnitNumber: form.internalUnitNumber || null,
        activationDate: form.activationDate || null,
        saleDate: form.saleDate || null,
        baseWarrantyDate: form.baseWarrantyDate || null,
        warrantyDate: form.warrantyDate || null,
        extendedWarranty: hasExtendedWarranty,
        extendedWarrantyStart: hasExtendedWarranty && form.extendedWarrantyStart ? form.extendedWarrantyStart : null,
        extendedWarrantyEnd: hasExtendedWarranty && form.extendedWarrantyEnd ? form.extendedWarrantyEnd : null,
        notes: form.notes || null,
      };

      const res = isEdit
        ? await apiRequest("PATCH", `/api/units/${params.id}`, payload)
        : await apiRequest("POST", "/api/units", payload);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erreur");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units"] });
      toast({ title: isEdit ? "Véhicule mis à jour" : "Véhicule créé avec succès" });
      navigate("/vehicules");
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));
  const nc = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setNewClient(prev => ({ ...prev, [key]: e.target.value }));

  if (isEdit && unitLoading) {
    return <Layout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  const models = form.make ? (MAKES[form.make] || []) : [];

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/vehicules")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#465c50]">
            {isEdit ? "Modifier le véhicule" : "Ajouter un véhicule"}
          </h1>
          <p className="text-sm text-gray-500">Remplissez toutes les informations du véhicule récréatif</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-6 max-w-4xl">

        {/* Vehicle Info */}
        <Card>
          <CardHeader><CardTitle>Informations du véhicule</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Année *</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.year} onChange={f("year")} required>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Marque *</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.make} onChange={e => setForm(p => ({ ...p, make: e.target.value, model: "" }))} required>
                  <option value="">Sélectionner une marque</option>
                  {Object.keys(MAKES).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Modèle *</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.model} onChange={f("model")} required disabled={!form.make}>
                  <option value="">Sélectionner un modèle</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">NIV *</label>
                <Input placeholder="Numéro d'identification complet" value={form.vin} onChange={f("vin")} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">NIV court</label>
                <Input placeholder="NIV abrégé" value={form.shortVin} onChange={f("shortVin")} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Couleur</label>
                <Input placeholder="Couleur du véhicule" value={form.color} onChange={f("color")} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Numéro d'unité interne</label>
                <Input placeholder="Numéro interne" value={form.internalUnitNumber} onChange={f("internalUnitNumber")} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Date de vente</label>
                <Input type="date" value={form.saleDate} onChange={f("saleDate")} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Date d'activation</label>
                <Input type="date" value={form.activationDate} onChange={f("activationDate")} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Date de garantie de base</label>
                <Input type="date" value={form.baseWarrantyDate} onChange={f("baseWarrantyDate")} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Date de garantie</label>
                <Input type="date" value={form.warrantyDate} onChange={f("warrantyDate")} />
              </div>
            </div>

            {/* Extended Warranty */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasExtendedWarranty}
                  onChange={e => setHasExtendedWarranty(e.target.checked)}
                  className="rounded border-gray-300" />
                <span className="text-sm font-medium text-gray-700">Garantie prolongée achetée</span>
              </label>
              {hasExtendedWarranty && (
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Début garantie prolongée</label>
                    <Input type="date" value={form.extendedWarrantyStart} onChange={f("extendedWarrantyStart")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Fin garantie prolongée</label>
                    <Input type="date" value={form.extendedWarrantyEnd} onChange={f("extendedWarrantyEnd")} />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
              <Textarea placeholder="Notes additionnelles..." value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Client */}
        <Card>
          <CardHeader><CardTitle>Propriétaire</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button type="button" variant={clientMode === "select" ? "default" : "outline"}
                onClick={() => setClientMode("select")} className="flex-1">
                Sélectionner un client existant
              </Button>
              <Button type="button" variant={clientMode === "create" ? "default" : "outline"}
                onClick={() => setClientMode("create")} className="flex-1">
                <Plus className="h-4 w-4 mr-1" /> Créer un nouveau client
              </Button>
            </div>

            {clientMode === "select" && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Client *</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.clientId} onChange={f("clientId")} required>
                  <option value="">Sélectionner un client</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.fullName} — {c.email}</option>
                  ))}
                </select>
              </div>
            )}

            {clientMode === "create" && (
              <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                <h3 className="font-medium text-gray-800">Propriétaire principal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Prénom *</label>
                    <Input value={newClient.firstName} onChange={nc("firstName")} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Nom *</label>
                    <Input value={newClient.lastName} onChange={nc("lastName")} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Courriel *</label>
                    <Input type="email" value={newClient.email} onChange={nc("email")} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Téléphone (domicile)</label>
                    <Input value={newClient.homePhone} onChange={nc("homePhone")} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Téléphone (travail)</label>
                    <Input value={newClient.workPhone} onChange={nc("workPhone")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Adresse</label>
                    <Input value={newClient.address} onChange={nc("address")} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Ville</label>
                    <Input value={newClient.city} onChange={nc("city")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Province</label>
                    <Input value={newClient.province} onChange={nc("province")} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Code postal</label>
                    <Input value={newClient.postalCode} onChange={nc("postalCode")} />
                  </div>
                </div>

                {/* Co-owner */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={hasCoOwner} onChange={e => setHasCoOwner(e.target.checked)}
                      className="rounded border-gray-300" />
                    <span className="text-sm font-medium text-gray-700">Ajouter un co-propriétaire</span>
                  </label>
                </div>

                {hasCoOwner && (
                  <div className="space-y-4 border-t pt-4">
                    <h3 className="font-medium text-gray-800">Co-propriétaire</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Prénom</label>
                        <Input value={newClient.coOwnerFirstName} onChange={nc("coOwnerFirstName")} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Nom</label>
                        <Input value={newClient.coOwnerLastName} onChange={nc("coOwnerLastName")} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Courriel</label>
                        <Input type="email" value={newClient.coOwnerEmail} onChange={nc("coOwnerEmail")} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Tél. domicile</label>
                        <Input value={newClient.coOwnerPhone} onChange={nc("coOwnerPhone")} />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Tél. travail</label>
                        <Input value={newClient.coOwnerWorkPhone} onChange={nc("coOwnerWorkPhone")} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate("/vehicules")} className="flex-1 md:flex-none md:w-32">
            Annuler
          </Button>
          <Button type="submit" className="flex-1 md:flex-none md:w-48 bg-[#f5901d] hover:bg-[#e07d0b]"
            disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? "Enregistrer les modifications" : "Créer le véhicule"}
          </Button>
        </div>
      </form>
    </Layout>
  );
}
