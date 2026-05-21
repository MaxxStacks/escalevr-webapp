import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";

// Profile settings schema
const profileSchema = z.object({
  fullName: z.string().min(1, "Le nom complet est requis"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().optional(),
});

// Password settings schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
  newPassword: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string().min(6, "La confirmation du mot de passe est requise"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// Notification settings schema
const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  jobUpdates: z.boolean(),
  claimUpdates: z.boolean(),
  marketingEmails: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;
type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const getInitials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase();

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch(`/api/users/${user?.id}/avatar`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Échec du téléversement");
      return res.json() as Promise<{ avatarUrl: string }>;
    },
    onSuccess: (data) => {
      setAvatarPreview(data.avatarUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Photo mise à jour", description: "Votre photo de profil a été mise à jour." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour la photo.", variant: "destructive" });
    },
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
    uploadPhotoMutation.mutate(file);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    },
  });
  
  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Notification form
  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      jobUpdates: true,
      claimUpdates: true,
      marketingEmails: false,
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      // Update user data in query cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Also update localStorage to keep it in sync
      const USER_STORAGE_KEY = "gestionvr_user";
      try {
        const savedUser = localStorage.getItem(USER_STORAGE_KEY);
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          const newUserData = { ...userData, ...updatedUser };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUserData));
        }
      } catch (error) {
        console.error("Failed to update localStorage:", error);
      }
      
      toast({
        title: "Profil mis à jour",
        description: "Votre profil a été mis à jour avec succès",
      });
    },
    onError: (error) => {
      toast({
        title: "Échec de la mise à jour",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormValues) => {
      await apiRequest("POST", `/api/users/${user?.id}/change-password`, data);
    },
    onSuccess: () => {
      toast({
        title: "Mot de passe modifié",
        description: "Votre mot de passe a été modifié avec succès",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: (error) => {
      toast({
        title: "Échec de la modification du mot de passe",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Save notification settings mutation
  const saveNotificationsMutation = useMutation({
    mutationFn: async (data: NotificationFormValues) => {
      await apiRequest("PATCH", `/api/users/${user?.id}/notifications`, data);
    },
    onSuccess: () => {
      toast({
        title: "Paramètres de notification enregistrés",
        description: "Vos préférences de notification ont été mises à jour",
      });
    },
    onError: (error) => {
      toast({
        title: "Échec de l'enregistrement des paramètres",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Submit handlers
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    changePasswordMutation.mutate(data);
  };
  
  const onNotificationSubmit = (data: NotificationFormValues) => {
    saveNotificationsMutation.mutate(data);
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#465c50]">Paramètres</h1>
        <p className="text-sm text-gray-600">
          Gérer vos paramètres de compte et préférences
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="password">Mot de passe</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informations du profil</CardTitle>
              <CardDescription>
                Mettre à jour vos informations personnelles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Photo upload */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    {(avatarPreview || user?.avatarUrl) ? (
                      <AvatarImage src={avatarPreview || user?.avatarUrl || undefined} alt={user?.fullName || undefined} />
                    ) : (
                      <AvatarFallback className="text-lg bg-primary/10 text-primary">
                        {user?.fullName ? getInitials(user.fullName) : "?"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 bg-[#f5901d] text-white rounded-full p-1.5 hover:bg-[#e07d0b] transition-colors"
                    title="Changer la photo"
                  >
                    {uploadPhotoMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Camera className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <div>
                  <p className="text-sm font-medium">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground mb-1">{user?.role}</p>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="text-xs text-[#f5901d] hover:underline"
                  >
                    Changer la photo de profil
                  </button>
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <FormField
                    control={profileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Courriel</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro de téléphone</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          Optionnel: Utilisé pour les notifications de service
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="bg-[#f5901d] hover:bg-[#e07d0b]"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement...
                      </>
                    ) : "Enregistrer les modifications"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Password Settings */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Changer le mot de passe</CardTitle>
              <CardDescription>
                Mettez à jour votre mot de passe pour sécuriser votre compte
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mot de passe actuel</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nouveau mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Doit contenir au moins 6 caractères
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmer le nouveau mot de passe</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="bg-[#f5901d] hover:bg-[#e07d0b]"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Modification en cours...
                      </>
                    ) : "Changer le mot de passe"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Préférences de notification</CardTitle>
              <CardDescription>
                Gérez la façon dont vous recevez les notifications et les mises à jour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Notifications par email</FormLabel>
                          <FormDescription>
                            Recevoir des notifications par email
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationForm.control}
                    name="jobUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Mises à jour des travaux</FormLabel>
                          <FormDescription>
                            Recevoir des mises à jour lorsque l'état de vos travaux change
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationForm.control}
                    name="claimUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Mises à jour des réclamations</FormLabel>
                          <FormDescription>
                            Recevoir des mises à jour concernant les réclamations de garantie et d'assurance
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={notificationForm.control}
                    name="marketingEmails"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Emails promotionnels</FormLabel>
                          <FormDescription>
                            Recevoir des offres promotionnelles et des nouvelles sur nos services
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="bg-[#f5901d] hover:bg-[#e07d0b]"
                    disabled={saveNotificationsMutation.isPending}
                  >
                    {saveNotificationsMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enregistrement des préférences...
                      </>
                    ) : "Enregistrer les préférences"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
