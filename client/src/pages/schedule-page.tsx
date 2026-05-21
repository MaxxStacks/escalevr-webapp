import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import StatusBadge from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ChevronLeft, ChevronRight, Plus, X, Clock, Truck, User, Wrench } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const HOURS = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(":");
  return (
    <div className="flex items-center gap-1">
      <select
        className="flex h-10 rounded-md border border-input bg-background px-2 py-2 text-sm"
        value={h}
        onChange={e => onChange(`${e.target.value}:${m}`)}
      >
        {HOURS.map(hour => <option key={hour} value={hour}>{hour}</option>)}
      </select>
      <span className="text-gray-400 font-medium">:</span>
      <select
        className="flex h-10 rounded-md border border-input bg-background px-2 py-2 text-sm"
        value={MINUTES.includes(m) ? m : "00"}
        onChange={e => onChange(`${h}:${e.target.value}`)}
      >
        {MINUTES.map(min => <option key={min} value={min}>{min}</option>)}
      </select>
    </div>
  );
}

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];
const weekDays = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

const jobTypeColors: Record<string, { bg: string; text: string; label: string }> = {
  DAF:              { bg: "rgba(59,130,246,0.12)",  text: "rgb(37,99,235)",    label: "DAF" },
  PDI:              { bg: "rgba(16,185,129,0.12)",  text: "rgb(5,150,105)",    label: "PDI" },
  warranty:         { bg: "rgba(79,70,229,0.12)",   text: "rgb(79,70,229)",    label: "Garantie" },
  extended_warranty:{ bg: "rgba(139,92,246,0.12)",  text: "rgb(109,40,217)",   label: "Garantie prolongée" },
  insurance:        { bg: "rgba(245,158,11,0.12)",  text: "rgb(217,119,6)",    label: "Assurance" },
  seasonal:         { bg: "rgba(236,72,153,0.12)",  text: "rgb(190,24,93)",    label: "Saisonnier" },
  regular:          { bg: "rgba(107,114,128,0.12)", text: "rgb(75,85,99)",     label: "Service régulier" },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function SchedulePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<{ day: number; month: number; year: number } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    timeStart: "08:00",
    timeEnd: "10:00",
    unitId: "",
    technicianId: "",
    type: "regular",
    description: "",
    partsRequired: "",
  });

  const { data: events = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/schedule"] });
  const { data: units = [] } = useQuery<any[]>({ queryKey: ["/api/units"] });
  const { data: technicians = [] } = useQuery<any[]>({
    queryKey: ["/api/users/role/technician"],
    enabled: ["admin", "service"].includes(user?.role as string),
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/jobs", data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erreur lors de la création du service");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schedule"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Service créé avec succès" });
      setShowForm(false);
      setFormData({ timeStart: "08:00", timeEnd: "10:00", unitId: "", technicianId: "", type: "regular", description: "", partsRequired: "" });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const generateDays = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDay(currentYear, currentMonth);
    const days: any[] = [];

    const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrev = getDaysInMonth(prevY, prevM);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrev - i, month: prevM, year: prevY, isCurrentMonth: false, events: [] });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const dateStr = date.toISOString().split("T")[0];
      const dayEvents = events.filter((e: any) => {
        const ed = new Date(e.start);
        return ed.toISOString().split("T")[0] === dateStr;
      });
      days.push({
        day: i, month: currentMonth, year: currentYear, isCurrentMonth: true,
        isToday: date.toDateString() === new Date().toDateString(),
        events: dayEvents,
      });
    }

    const nextM = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
    for (let i = 1; days.length < 42; i++) {
      days.push({ day: i, month: nextM, year: nextY, isCurrentMonth: false, events: [] });
    }
    return days;
  };

  const calendarDays = generateDays();

  const handleDayClick = (d: any) => {
    if (!d.isCurrentMonth) return;
    setSelectedDay({ day: d.day, month: d.month, year: d.year });
    setShowForm(false);
  };

  const selectedDayEvents = selectedDay
    ? events.filter((e: any) => {
        const ed = new Date(e.start);
        return (
          ed.getFullYear() === selectedDay.year &&
          ed.getMonth() === selectedDay.month &&
          ed.getDate() === selectedDay.day
        );
      })
    : [];

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!selectedDay) return;

    const scheduledDate = new Date(selectedDay.year, selectedDay.month, selectedDay.day);
    const [sh, sm] = formData.timeStart.split(":").map(Number);
    scheduledDate.setHours(sh, sm, 0, 0);

    const selectedUnit = units.find((u: any) => u.id === Number(formData.unitId));
    if (!selectedUnit) return toast({ title: "Veuillez sélectionner un véhicule", variant: "destructive" });

    const jobNum = `SRV-${Date.now()}`;

    createJobMutation.mutate({
      jobNumber: jobNum,
      unitId: Number(formData.unitId),
      clientId: selectedUnit.clientId,
      type: formData.type,
      status: "scheduled",
      description: formData.description || `Service ${formData.type}`,
      dateScheduled: scheduledDate.toISOString(),
      technicianId: formData.technicianId ? Number(formData.technicianId) : null,
      partsRequired: formData.partsRequired || null,
      timeStart: formData.timeStart,
      timeEnd: formData.timeEnd,
      clientVisible: true,
    });
  };

  const canBook = ["admin", "service"].includes(user?.role as string);

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
        <p className="text-sm text-gray-500">
          {user?.role === "technician"
            ? "Vos services assignés"
            : "Consultez et gérez les rendez-vous de service"}
        </p>
      </div>

      <div className={`grid gap-6 ${selectedDay ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"}`}>
        {/* Calendar */}
        <div className={selectedDay ? "lg:col-span-7" : ""}>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Calendrier de service</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium min-w-[150px] text-center">
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <Button variant="outline" size="sm" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 mb-1">
                {weekDays.map(d => <div key={d} className="py-2">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-md overflow-hidden">
                {calendarDays.map((d, i) => {
                  const isSelected = selectedDay && d.day === selectedDay.day && d.month === selectedDay.month && d.year === selectedDay.year;
                  return (
                    <div
                      key={i}
                      onClick={() => handleDayClick(d)}
                      className={`min-h-[80px] p-1 bg-white cursor-pointer transition-colors ${
                        !d.isCurrentMonth ? "bg-gray-50 text-gray-300" : "hover:bg-primary/5"
                      } ${isSelected ? "ring-2 ring-inset ring-primary" : ""}`}
                    >
                      <div className={`text-sm w-6 h-6 flex items-center justify-center rounded-full mb-1 ${
                        d.isToday ? "bg-primary text-white font-bold" : ""
                      }`}>
                        {d.day}
                      </div>
                      <div className="space-y-0.5">
                        {d.events.slice(0, 2).map((e: any, j: number) => {
                          const colors = jobTypeColors[e.type] || jobTypeColors.regular;
                          return (
                            <div key={j} className="text-xs px-1 py-0.5 rounded truncate"
                              style={{ backgroundColor: colors.bg, color: colors.text }}>
                              {e.timeStart ? `${e.timeStart} ` : ""}{e.title?.slice(0, 12)}
                            </div>
                          );
                        })}
                        {d.events.length > 2 && (
                          <div className="text-xs text-gray-400 px-1">+{d.events.length - 2}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-3">
                {Object.entries(jobTypeColors).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: val.text }} />
                    <span className="text-xs text-gray-500">{val.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Panel */}
        {selectedDay && (
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {selectedDay.day} {monthNames[selectedDay.month]} {selectedDay.year}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedDay(null); setShowForm(false); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Jobs for this day */}
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map((e: any) => {
                    const colors = jobTypeColors[e.type] || jobTypeColors.regular;
                    return (
                      <div key={e.id} className="rounded-md p-3 border-l-4"
                        style={{ borderLeftColor: colors.text, backgroundColor: colors.bg }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm" style={{ color: colors.text }}>
                              {colors.label} — {e.jobNumber}
                            </p>
                            <p className="text-sm text-gray-700 mt-0.5">{e.title}</p>
                            {e.timeStart && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {e.timeStart}{e.timeEnd ? ` – ${e.timeEnd}` : ""}
                              </p>
                            )}
                          </div>
                          <StatusBadge status={e.status} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Aucun service ce jour</p>
                )}

                {/* Book button */}
                {canBook && !showForm && (
                  <Button className="w-full bg-[#f5901d] hover:bg-[#e07d0b]" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un service
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Booking Form */}
            {canBook && showForm && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Nouveau service</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Time range */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                        <Clock className="h-4 w-4" /> Plage horaire
                      </label>
                      <div className="flex items-center gap-2">
                        <TimeSelect value={formData.timeStart} onChange={v => setFormData(f => ({ ...f, timeStart: v }))} />
                        <span className="text-gray-500 text-sm">à</span>
                        <TimeSelect value={formData.timeEnd} onChange={v => setFormData(f => ({ ...f, timeEnd: v }))} />
                      </div>
                    </div>

                    {/* Job type */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                        <Wrench className="h-4 w-4" /> Type de service
                      </label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.type}
                        onChange={e => setFormData(f => ({ ...f, type: e.target.value }))}
                      >
                        {Object.entries(jobTypeColors).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Vehicle */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                        <Truck className="h-4 w-4" /> Véhicule
                      </label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.unitId}
                        onChange={e => setFormData(f => ({ ...f, unitId: e.target.value }))}
                        required
                      >
                        <option value="">Sélectionner un véhicule</option>
                        {units.map((u: any) => (
                          <option key={u.id} value={u.id}>
                            {u.year} {u.make} {u.model} — {u.shortVin || u.vin}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Technician */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
                        <User className="h-4 w-4" /> Technicien assigné (optionnel)
                      </label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={formData.technicianId}
                        onChange={e => setFormData(f => ({ ...f, technicianId: e.target.value }))}
                      >
                        <option value="">Aucun technicien</option>
                        {technicians.map((t: any) => (
                          <option key={t.id} value={t.id}>{t.fullName}</option>
                        ))}
                      </select>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                      <Textarea
                        placeholder="Description du service..."
                        value={formData.description}
                        onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    {/* Parts */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Pièces requises (optionnel)</label>
                      <Textarea
                        placeholder="Liste des pièces nécessaires..."
                        value={formData.partsRequired}
                        onChange={e => setFormData(f => ({ ...f, partsRequired: e.target.value }))}
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <Button type="button" variant="outline" className="flex-1"
                        onClick={() => setShowForm(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" className="flex-1 bg-[#f5901d] hover:bg-[#e07d0b]"
                        disabled={createJobMutation.isPending}>
                        {createJobMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Créer le service
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
