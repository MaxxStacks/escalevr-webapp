import { useState, useEffect } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const ROLE_LABELS: Record<string, string> = {
  service: "Agent de service",
  technician: "Technicien",
  claim_agent: "Agent de réclamation",
  financement: "Agent de financement",
  admin: "Administrateur",
};

const ROLE_BACK: Record<string, string> = {
  service: "/service-agents",
  technician: "/technicians",
  claim_agent: "/claim-agents",
  financement: "/finance-agents",
  admin: "/users",
};

export default function StaffFormPage() {
  const [, navigate] = useLocation();
  const params = useParams<{ id?: string }>();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const roleParam = searchParams.get("role") || "service";
  const isEdit = !!params.id;
  const { toast } = useToast();

  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", workPhone: "",
    address: "", city: "", province: "", postalCode: "",
    role: roleParam,
  });

  const { data: staff, isLoading } = useQuery<any>({
    queryKey: [`/api/users/${params.id}`],
    enabled: isEdit,
  });

  useEffect(() => {
    if (staff) {
      const [first = "", ...rest] = (staff.fullName || "").split(" ");
      setForm({
        firstName: first,
        lastName: rest.join(" "),
        email: staff.email || "",
        phone: staff.phone || "",
        workPhone: staff.workPhone || "",
        address: staff.address || "",
        city: staff.city || "",
        province: staff.province || "",
        postalCode: staff.postalCode || "",
        role: staff.role || roleParam,
      });
    }
  }, [staff]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        fullName: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        phone: form.phone || null,
        workPhone: form.workPhone || null,
        address: form.address || null,
        city: form.city || null,
        province: form.province || null,
        postalCode: form.postalCode || null,
        role: form.role,
      };

      if (isEdit) {
        const res = await apiRequest("PATCH", `/api/users/${params.id}`, payload);
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Erreur"); }
        return res.json();
      } else {
        const username = form.email.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) + Date.now().toString().slice(-4);
        const res = await apiRequest("POST", "/api/register", {
          ...payload,
          username,
          password: Math.random().toString(36).slice(-8),
        });
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || "Erreur"); }
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/role/${form.role}`] });
      toast({ title: isEdit ? "Employé mis à jour" : "Employé créé avec succès" });
      navigate(ROLE_BACK[form.role] || "/users");
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  const backPath = ROLE_BACK[form.role] || "/users";

  if (isEdit && isLoading) {
    return <Layout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#465c50]">
            {isEdit ? "Modifier l'employé" : `Ajouter un ${ROLE_LABELS[form.role] || "employé"}`}
          </h1>
          <p className="text-sm text-gray-500">Informations de l'employé</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader><CardTitle>Informations de l'employé</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {!isEdit && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Rôle *</label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.role} onChange={f("role")}>
                  {Object.entries(ROLE_LABELS).filter(([k]) => k !== "admin" && k !== "client").map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            )}

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
                <label className="text-sm font-medium text-gray-700 block mb-1">Téléphone</label>
                <Input value={form.phone} onChange={f("phone")} />
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

        <div className="flex gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate(backPath)} className="w-32">Annuler</Button>
          <Button type="submit" className="w-48 bg-[#f5901d] hover:bg-[#e07d0b]" disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? "Enregistrer" : "Créer l'employé"}
          </Button>
        </div>
      </form>
    </Layout>
  );
}
