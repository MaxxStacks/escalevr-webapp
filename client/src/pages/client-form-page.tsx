import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const emptyForm = {
  firstName: "", lastName: "", email: "", homePhone: "", workPhone: "",
  address: "", city: "", province: "", postalCode: "",
  coOwnerFirstName: "", coOwnerLastName: "", coOwnerEmail: "",
  coOwnerPhone: "", coOwnerWorkPhone: "",
};

export default function ClientFormPage() {
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const isEdit = !!params.id;
  const { toast } = useToast();
  const [hasCoOwner, setHasCoOwner] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: client, isLoading } = useQuery<any>({
    queryKey: [`/api/users/${params.id}`],
    enabled: isEdit,
  });

  useEffect(() => {
    if (client) {
      const [first = "", ...rest] = (client.fullName || "").split(" ");
      setForm({
        firstName: first,
        lastName: rest.join(" "),
        email: client.email || "",
        homePhone: client.phone || "",
        workPhone: client.workPhone || "",
        address: client.address || "",
        city: client.city || "",
        province: client.province || "",
        postalCode: client.postalCode || "",
        coOwnerFirstName: client.coOwnerFirstName || "",
        coOwnerLastName: client.coOwnerLastName || "",
        coOwnerEmail: client.coOwnerEmail || "",
        coOwnerPhone: client.coOwnerPhone || "",
        coOwnerWorkPhone: client.coOwnerWorkPhone || "",
      });
      setHasCoOwner(!!(client.coOwnerFirstName || client.coOwnerLastName));
    }
  }, [client]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.email) throw new Error("Le courriel est requis");
      const payload = {
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.homePhone || null,
        workPhone: form.workPhone || null,
        address: form.address || null,
        city: form.city || null,
        province: form.province || null,
        postalCode: form.postalCode || null,
        coOwnerFirstName: hasCoOwner ? form.coOwnerFirstName || null : null,
        coOwnerLastName: hasCoOwner ? form.coOwnerLastName || null : null,
        coOwnerEmail: hasCoOwner ? form.coOwnerEmail || null : null,
        coOwnerPhone: hasCoOwner ? form.coOwnerPhone || null : null,
        coOwnerWorkPhone: hasCoOwner ? form.coOwnerWorkPhone || null : null,
      };

      if (isEdit) {
        const res = await apiRequest("PATCH", `/api/users/${params.id}`, { ...payload, role: "client" });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Erreur"); }
        return res.json();
      } else {
        const username = form.email.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) + Date.now().toString().slice(-4);
        const res = await apiRequest("POST", "/api/register", {
          ...payload,
          username,
          password: Math.random().toString(36).slice(-8),
          role: "client",
        });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Erreur"); }
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/role/client"] });
      toast({ title: isEdit ? "Client mis à jour" : "Client créé avec succès" });
      navigate("/clients");
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  if (isEdit && isLoading) {
    return <Layout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#465c50]">{isEdit ? "Modifier le client" : "Ajouter un client"}</h1>
          <p className="text-sm text-gray-500">Remplissez les informations du propriétaire</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-6 max-w-3xl">

        {/* Owner */}
        <Card>
          <CardHeader><CardTitle>Propriétaire principal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Prénom *</label>
                <Input value={form.firstName} onChange={f("firstName")} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nom *</label>
                <Input value={form.lastName} onChange={f("lastName")} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Courriel *</label>
                <Input type="email" value={form.email} onChange={f("email")} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Téléphone (domicile)</label>
                <Input value={form.homePhone} onChange={f("homePhone")} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Téléphone (travail)</label>
                <Input value={form.workPhone} onChange={f("workPhone")} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Adresse</label>
                <Input value={form.address} onChange={f("address")} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Ville</label>
                <Input value={form.city} onChange={f("city")} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Province</label>
                <Input value={form.province} onChange={f("province")} />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Code postal</label>
                <Input value={form.postalCode} onChange={f("postalCode")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Co-owner toggle */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Co-propriétaire</CardTitle>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasCoOwner} onChange={e => setHasCoOwner(e.target.checked)}
                  className="rounded border-gray-300" />
                <span className="text-sm text-gray-600">Ajouter un co-propriétaire</span>
              </label>
            </div>
          </CardHeader>
          {hasCoOwner && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Prénom</label>
                  <Input value={form.coOwnerFirstName} onChange={f("coOwnerFirstName")} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Nom</label>
                  <Input value={form.coOwnerLastName} onChange={f("coOwnerLastName")} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Courriel</label>
                  <Input type="email" value={form.coOwnerEmail} onChange={f("coOwnerEmail")} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Tél. domicile</label>
                  <Input value={form.coOwnerPhone} onChange={f("coOwnerPhone")} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Tél. travail</label>
                  <Input value={form.coOwnerWorkPhone} onChange={f("coOwnerWorkPhone")} />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        <div className="flex gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate("/clients")} className="w-32">Annuler</Button>
          <Button type="submit" className="w-48 bg-[#f5901d] hover:bg-[#e07d0b]" disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer le client"}
          </Button>
        </div>
      </form>
    </Layout>
  );
}
