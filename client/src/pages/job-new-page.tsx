import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/layout";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react";

// Form schema
const formSchema = z.object({
  type: z.enum(["DAF", "PDI", "warranty", "insurance", "seasonal", "regular"], {
    required_error: "Veuillez sélectionner un type de service",
  }),
  description: z.string().min(5, "La description doit contenir au moins 5 caractères"),
  unitId: z.number().optional(),
  technicianId: z.number().optional(),
  scheduledDate: z.date().optional(),
  clientVisible: z.boolean().default(false),
  estimatedHours: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function JobNewPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Fetch units for dropdown
  const { data: units, isLoading: isLoadingUnits } = useQuery({
    queryKey: ["/api/units"],
    queryFn: async () => {
      const res = await fetch("/api/units");
      if (!res.ok) throw new Error("Échec de récupération des véhicules");
      return res.json();
    }
  });
  
  // Fetch technicians for dropdown
  const { data: technicians, isLoading: isLoadingTechnicians } = useQuery({
    queryKey: ["/api/users/role/technician"],
    queryFn: async () => {
      const res = await fetch("/api/users/role/technician");
      if (!res.ok) throw new Error("Échec de récupération des techniciens");
      return res.json();
    }
  });

  // French translations for job types
  const jobTypeTranslations: Record<string, string> = {
    "DAF": "DAF",
    "PDI": "PDI",
    "warranty": "Garantie",
    "insurance": "Assurance",
    "seasonal": "Saisonnier",
    "regular": "Régulier"
  };

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      clientVisible: false,
      estimatedHours: "",
      notes: "",
    },
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest("POST", "/api/jobs", {
        ...data,
        status: "scheduled",
        dateCreated: new Date().toISOString(),
        clientVisible: data.clientVisible || false,
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Échec lors de la création du service");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Service créé avec succès",
        description: "Le nouveau service a été créé",
      });
      setLocation("/jobs");
    },
    onError: (error: Error) => {
      toast({
        title: "Échec lors de la création du service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    createJobMutation.mutate(data);
  };

  // Go back to jobs list
  const handleBack = () => {
    setLocation("/jobs");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-[#465c50]">Nouveau Service</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouveau service</CardTitle>
            <CardDescription>Complétez les informations pour créer un nouveau service</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Type de service */}
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de service</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(jobTypeTranslations).map(([type, label]) => (
                              <SelectItem key={type} value={type}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Véhicule */}
                  <FormField
                    control={form.control}
                    name="unitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Véhicule</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={isLoadingUnits}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un véhicule" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingUnits ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : units?.length > 0 ? (
                              units.map((unit: any) => (
                                <SelectItem key={unit.id} value={unit.id.toString()}>
                                  {unit.year} {unit.make} {unit.model} ({unit.vin.slice(-6)})
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                Aucun véhicule disponible
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Technicien assigné */}
                  <FormField
                    control={form.control}
                    name="technicianId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Technicien assigné</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                          disabled={isLoadingTechnicians}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un technicien" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingTechnicians ? (
                              <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : technicians?.length > 0 ? (
                              technicians.map((technician: any) => (
                                <SelectItem key={technician.id} value={technician.id.toString()}>
                                  {technician.fullName}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>
                                Aucun technicien disponible
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Date planifiée */}
                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date planifiée</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${
                                  !field.value && "text-muted-foreground"
                                }`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: fr })
                                ) : (
                                  <span>Sélectionnez une date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                setDate(date);
                              }}
                              disabled={(date) => date < new Date("1900-01-01")}
                              initialFocus
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Heures estimées */}
                  <FormField
                    control={form.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Heures estimées</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.5"
                            min="0"
                            placeholder="Nombre d'heures estimées"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Description détaillée du service à effectuer"
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Notes additionnelles pour ce service"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Visible par le client */}
                <FormField
                  control={form.control}
                  name="clientVisible"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Visible par le client</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Cochez cette case pour rendre ce service visible par le client
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleBack}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-[#f5901d] hover:bg-[#e07d0b]"
                    disabled={createJobMutation.isPending}
                  >
                    {createJobMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Créer service
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}