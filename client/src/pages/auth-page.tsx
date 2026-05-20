import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Caravan } from "lucide-react";
import escaleLogo from "../assets/escale-logo-dark.png";

// Login Form Schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// Register Form Schema - extend the insertUserSchema from shared schema
const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [, setLocation] = useLocation();

  // Redirect after successful login
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      email: "",
      role: "client", // Default role is client for new registrations
      phone: "",
      avatarUrl: null,
    },
  });

  // Handle form submissions
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    // Remove confirmPassword as it's not in the schema
    const { confirmPassword, ...registrationData } = data;
    registerMutation.mutate(registrationData);
  };
  
  // If user is already logged in, redirect to home page
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Column - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 bg-white">
        <Card className="w-full max-w-md border-t-4 border-[#f5901d] shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <img src={escaleLogo} alt="Escale VR" className="h-16" />
            </div>
            <CardTitle className="text-2xl text-center text-[#465c50]">Portail de Service</CardTitle>
            <CardDescription className="text-center">
              Connectez-vous pour accéder au système de gestion de services de votre VR!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-[#465c50] data-[state=active]:text-white"
                >
                  Connexion
                </TabsTrigger>
                <TabsTrigger 
                  value="register"
                  className="data-[state=active]:bg-[#465c50] data-[state=active]:text-white" 
                >
                  S'inscrire
                </TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#465c50]">Nom d'utilisateur</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Entrez votre nom d'utilisateur" 
                              {...field}
                              className="focus-visible:ring-[#465c50]" 
                            />
                          </FormControl>
                          <FormMessage className="text-[#f5901d]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#465c50]">Mot de passe</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Entrez votre mot de passe" 
                              {...field}
                              className="focus-visible:ring-[#465c50]" 
                            />
                          </FormControl>
                          <FormMessage className="text-[#f5901d]" />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-[#f5901d] hover:bg-[#e07d0b] text-white" 
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connexion en cours...
                        </>
                      ) : (
                        "Se connecter"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#465c50]">Nom d'utilisateur</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Choisissez un nom d'utilisateur" 
                              {...field} 
                              className="focus-visible:ring-[#465c50]"
                            />
                          </FormControl>
                          <FormMessage className="text-[#f5901d]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#465c50]">Nom complet</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Entrez votre nom complet" 
                              {...field} 
                              className="focus-visible:ring-[#465c50]"
                            />
                          </FormControl>
                          <FormMessage className="text-[#f5901d]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#465c50]">Courriel</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="Entrez votre courriel" 
                              {...field} 
                              className="focus-visible:ring-[#465c50]"
                            />
                          </FormControl>
                          <FormMessage className="text-[#f5901d]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#465c50]">Téléphone</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Entrez votre numéro de téléphone (optionnel)" 
                              {...field} 
                              className="focus-visible:ring-[#465c50]"
                            />
                          </FormControl>
                          <FormMessage className="text-[#f5901d]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#465c50]">Mot de passe</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Créez un mot de passe" 
                              {...field} 
                              className="focus-visible:ring-[#465c50]"
                            />
                          </FormControl>
                          <FormMessage className="text-[#f5901d]" />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#465c50]">Confirmer le mot de passe</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirmez votre mot de passe" 
                              {...field} 
                              className="focus-visible:ring-[#465c50]"
                            />
                          </FormControl>
                          <FormMessage className="text-[#f5901d]" />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full bg-[#f5901d] hover:bg-[#e07d0b] text-white" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Inscription en cours...
                        </>
                      ) : (
                        "S'inscrire"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <div className="text-xs text-[#465c50] text-center w-full font-medium">
              GestionVR - Gestion de service Escale VR Beaumont
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Right Column - Hero */}
      <div className="hidden md:flex md:w-1/2 bg-[#465c50] items-center justify-center p-8">
        <div className="max-w-md text-white">
          <h1 className="text-3xl font-bold mb-4">Portail de Service</h1>
          <p className="mb-6">
            Bienvenue au portail de gestion des services d'Escale VR Beaumont.
            Suivez vos réparations de VR, l'entretien et les réclamations de garantie en un seul endroit.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 rounded-full bg-[#f5901d] p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">Mises à jour en temps réel</h3>
                <p className="text-white/90">Restez informé sur l'état de votre service VR en temps réel.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 rounded-full bg-[#f5901d] p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">Documentation photo</h3>
                <p className="text-white/90">Consultez des photos détaillées des réparations et de l'entretien de votre véhicule.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 rounded-full bg-[#f5901d] p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium">Suivi des réclamations de garantie</h3>
                <p className="text-white/90">Surveillez l'état de vos réclamations de garantie et d'assurance sans effort.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
