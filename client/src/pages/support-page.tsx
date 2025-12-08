import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import Layout from "@/components/layout/layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, FileQuestion, LifeBuoy, HelpCircle, MessagesSquare, Mail, Phone, Upload, Image } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Support ticket schema
const ticketSchema = z.object({
  subject: z.string().min(5, "Le sujet doit contenir au moins 5 caractères"),
  message: z.string().min(20, "Votre message doit contenir au moins 20 caractères"),
  email: z.string().email("Adresse email invalide").optional(),
  phoneNumber: z.string().min(10, "Le numéro de téléphone est requis"),
  photo: z.any().optional(),
});

type TicketFormValues = z.infer<typeof ticketSchema>;

// FAQ Search Schema
const searchSchema = z.object({
  query: z.string().min(3, "La recherche doit contenir au moins 3 caractères"),
});

type SearchFormValues = z.infer<typeof searchSchema>;

export default function SupportPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("contact");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Ticket form
  const ticketForm = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      subject: "",
      message: "",
      email: user?.email || "",
      phoneNumber: user?.phone || "",
      photo: undefined,
    },
  });

  // Search form
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      query: "",
    },
  });

  // Submit support ticket mutation
  const submitTicketMutation = useMutation({
    mutationFn: async (data: TicketFormValues) => {
      const response = await apiRequest("POST", "/api/support/tickets", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Demande envoyée",
        description: "Votre ticket de support a été soumis avec succès. Nous vous répondrons bientôt.",
      });
      ticketForm.reset({
        subject: "",
        message: "",
        email: user?.email || "",
        phoneNumber: user?.phone || "",
      });
    },
    onError: (error) => {
      toast({
        title: "Échec de l'envoi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // FAQ search mutation
  const searchFaqMutation = useMutation({
    mutationFn: async (data: SearchFormValues) => {
      // Dans une application réelle, cela ferait une recherche côté serveur
      // Ici, nous simulons une recherche côté client dans notre tableau FAQ
      setIsSearching(true);
      // Simuler un délai réseau pour montrer le chargement
      await new Promise(resolve => setTimeout(resolve, 500));

      const query = data.query.toLowerCase();
      const results = faqItems
        .filter(item => 
          item.question.toLowerCase().includes(query) || 
          item.answer.toLowerCase().includes(query)
        )
        .map(item => item.question);
      
      return results;
    },
    onSuccess: (results) => {
      setSearchResults(results);
      setIsSearching(false);
      
      if (results.length === 0) {
        toast({
          title: "Aucun résultat",
          description: "Aucune correspondance trouvée pour votre recherche.",
        });
      }
    },
    onError: (error) => {
      setIsSearching(false);
      toast({
        title: "Erreur de recherche",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Submit handlers
  const onSubmitTicket = (data: TicketFormValues) => {
    submitTicketMutation.mutate(data);
  };

  const onSubmitSearch = (data: SearchFormValues) => {
    searchFaqMutation.mutate(data);
  };

  // FAQ data
  const faqItems = [
    {
      question: "Comment puis-je créer un nouveau compte?",
      answer: "Pour créer un nouveau compte, cliquez sur 'Connexion' puis sur 'Créer un compte'. Remplissez les informations requises et suivez les instructions à l'écran pour finaliser votre inscription."
    },
    {
      question: "Comment puis-je suivre l'état de mon véhicule en réparation?",
      answer: "Pour suivre l'état de votre véhicule, connectez-vous à votre compte et accédez à la section 'Travaux'. Vous y trouverez tous vos travaux en cours avec leur statut actuel et un historique des mises à jour."
    },
    {
      question: "Quelles sont les étapes pour soumettre une réclamation de garantie?",
      answer: "Pour soumettre une réclamation de garantie, accédez à la page 'Travaux', sélectionnez le travail concerné, puis cliquez sur 'Créer une réclamation'. Remplissez le formulaire avec tous les détails nécessaires et joignez les photos ou documents pertinents."
    },
    {
      question: "Comment puis-je ajouter un nouveau véhicule à mon profil?",
      answer: "Pour ajouter un nouveau véhicule, accédez à la section 'Véhicules' et cliquez sur le bouton 'Ajouter un véhicule'. Vous devrez fournir les informations de base du véhicule, incluant la marque, le modèle, l'année et le numéro VIN."
    },
    {
      question: "Comment puis-je modifier mes coordonnées?",
      answer: "Pour modifier vos informations personnelles, accédez à la page 'Paramètres' et sélectionnez l'onglet 'Profil'. Vous pourrez y mettre à jour votre nom, adresse email et numéro de téléphone."
    },
    {
      question: "Que faire si je ne reçois pas de notifications?",
      answer: "Vérifiez d'abord vos paramètres de notification dans la section 'Paramètres' > 'Notifications'. Si le problème persiste, assurez-vous que votre adresse email est correcte et vérifiez votre dossier spam. Si vous rencontrez toujours des difficultés, contactez notre équipe de support."
    },
    {
      question: "Comment puis-je programmer un rendez-vous pour l'entretien de mon VR?",
      answer: "Pour planifier un rendez-vous d'entretien, accédez à la page 'Planification' et sélectionnez 'Nouveau rendez-vous'. Choisissez le véhicule concerné, la date et l'heure souhaitées, et le type de service requis."
    },
    {
      question: "Quels types de services sont couverts par la garantie?",
      answer: "La garantie couvre généralement les défauts de fabrication et de matériaux. Les services spécifiques couverts dépendent du type de garantie que vous avez. Vous pouvez consulter les détails de votre garantie dans la section 'Véhicules' > 'Détails de la garantie'."
    }
  ];

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#465c50]">Aide & Support</h1>
        <p className="text-sm text-gray-600">
          Obtenez de l'aide sur l'utilisation de la plateforme ou contactez notre équipe de support
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="contact">Contactez-nous</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
          <TabsTrigger value="guides">Guides</TabsTrigger>
        </TabsList>
        
        {/* Contact Us Tab */}
        <TabsContent value="contact">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Support Ticket Form */}
            <Card>
              <CardHeader>
                <CardTitle>Demande de support</CardTitle>
                <CardDescription>
                  Remplissez ce formulaire pour nous soumettre votre question ou problème
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...ticketForm}>
                  <form onSubmit={ticketForm.handleSubmit(onSubmitTicket)} className="space-y-4">
                    <FormField
                      control={ticketForm.control}
                      name="subject"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sujet</FormLabel>
                          <FormControl>
                            <Input placeholder="Résumez votre question ou problème" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={ticketForm.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Décrivez votre problème en détail"
                              className="min-h-[150px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={ticketForm.control}
                      name="photo"
                      render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel>Photo</FormLabel>
                          <FormControl>
                            <div className="flex flex-col w-full gap-2">
                              <label 
                                htmlFor="photo-upload" 
                                className="flex items-center justify-center gap-2 w-full px-4 py-2 border border-input rounded-md cursor-pointer hover:bg-muted transition-colors text-sm"
                              >
                                <Upload className="h-4 w-4 text-[#465c50]" />
                                <span>Téléverser une image</span>
                              </label>
                              <input
                                type="file"
                                id="photo-upload"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  onChange(file || undefined);
                                }}
                                {...fieldProps}
                              />
                              {value && typeof value === 'object' && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                  <Image className="h-4 w-4 text-[#f5901d]" />
                                  <span>{(value as File).name}</span>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormDescription>
                            Vous pouvez ajouter une image pour illustrer votre problème
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={ticketForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Courriel</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Votre courriel" {...field} />
                          </FormControl>
                          <FormDescription>
                            Nous utiliserons cette adresse pour vous répondre
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={ticketForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Téléphone</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre numéro" {...field} />
                          </FormControl>
                          <FormDescription>
                            Numéro auquel nous pouvons vous joindre
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-[#f5901d] hover:bg-[#e07d0b]"
                      disabled={submitTicketMutation.isPending}
                    >
                      {submitTicketMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : "Envoyer la demande"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Nous contacter directement</CardTitle>
                  <CardDescription>
                    Autres moyens de nous joindre pour assistance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <Phone className="h-5 w-5 text-[#465c50] mt-0.5" />
                    <div>
                      <h3 className="font-medium">Service à la clientèle</h3>
                      <p className="text-sm text-gray-500">418-833-5777</p>
                      <p className="text-sm text-gray-500">Lun - Ven, 9h à 18h</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <Mail className="h-5 w-5 text-[#465c50] mt-0.5" />
                    <div>
                      <h3 className="font-medium">Support par courriel</h3>
                      <p className="text-sm text-gray-500">info@escalevr.ca</p>
                      <p className="text-sm text-gray-500">Réponse en 24h ouvrables</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <MessagesSquare className="h-5 w-5 text-[#465c50] mt-0.5" />
                    <div>
                      <h3 className="font-medium">Clavardage en direct</h3>
                      <p className="text-sm text-gray-500">Disponible sur notre site web</p>
                      <p className="text-sm text-gray-500">Tous les jours, 9h à 17h</p>
                      <p className="text-sm text-gray-500">Selon la disponibilité des agents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Centre de service</CardTitle>
                  <CardDescription>
                    Notre emplacement physique
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">Escale VR Beaumont</p>
                    <p className="text-sm text-gray-500">12 rue de la Chute</p>
                    <p className="text-sm text-gray-500">Beaumont, QC G0R 1C0</p>
                    <Separator className="my-2" />
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Heures d'ouverture:</span><br />
                      Lundi au Vendredi: 9h à 18h<br />
                      Samedi: Fermé<br />
                      Dimanche: Fermé
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* FAQ Tab */}
        <TabsContent value="faq">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Rechercher dans la FAQ</CardTitle>
                  <CardDescription>
                    Trouvez rapidement des réponses à vos questions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...searchForm}>
                    <form onSubmit={searchForm.handleSubmit(onSubmitSearch)} className="space-y-4">
                      <FormField
                        control={searchForm.control}
                        name="query"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input 
                                  placeholder="Chercher dans la FAQ..." 
                                  className="pl-9"
                                  {...field} 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-[#f5901d] hover:bg-[#e07d0b]"
                        disabled={isSearching}
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Recherche...
                          </>
                        ) : "Rechercher"}
                      </Button>
                    </form>
                  </Form>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Résultats de recherche:</h3>
                      <ul className="space-y-2">
                        {searchResults.map((result, index) => (
                          <li key={index}>
                            <Button 
                              variant="link" 
                              className="p-0 text-left text-[#465c50] hover:text-[#f5901d]"
                              onClick={() => {
                                // Trouver l'ID de l'élément de FAQ correspondant
                                const faqIndex = faqItems.findIndex(item => item.question === result);
                                if (faqIndex !== -1) {
                                  // Ouvrir l'accordéon correspondant
                                  document.getElementById(`faq-item-${faqIndex}`)?.click();
                                }
                              }}
                            >
                              {result}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Catégories populaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => searchForm.setValue('query', 'compte')}
                    >
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Gestion du compte
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => searchForm.setValue('query', 'réclamation')}
                    >
                      <FileQuestion className="mr-2 h-4 w-4" />
                      Réclamations et garanties
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => searchForm.setValue('query', 'véhicule')}
                    >
                      <LifeBuoy className="mr-2 h-4 w-4" />
                      Gestion des véhicules
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Questions fréquemment posées</CardTitle>
                  <CardDescription>
                    Consultez nos réponses aux questions courantes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqItems.map((item, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger id={`faq-item-${index}`}>
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
                <CardFooter>
                  <p className="text-sm text-gray-500">
                    Vous ne trouvez pas la réponse à votre question? N'hésitez pas à nous contacter directement.
                  </p>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Guides Tab */}
        <TabsContent value="guides">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Guide d'utilisation pour les clients</CardTitle>
                <CardDescription>
                  Comment gérer vos véhicules et suivre vos services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Ce guide complet explique comment utiliser toutes les fonctionnalités disponibles pour les clients:
                </p>
                <ul className="space-y-2 list-disc list-inside text-gray-600">
                  <li>Ajouter et gérer vos véhicules</li>
                  <li>Suivre l'état de vos réparations</li>
                  <li>Consulter l'historique de service</li>
                  <li>Communiquer avec les techniciens</li>
                  <li>Gérer vos rendez-vous</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-[#f5901d] hover:bg-[#e07d0b]"
                  onClick={() => window.open('/docs/guide-client.html', '_blank')}
                >
                  Consulter le guide
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Guide des réclamations</CardTitle>
                <CardDescription>
                  Procédures pour les réclamations de garantie et d'assurance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Apprenez à naviguer dans le processus de réclamation:
                </p>
                <ul className="space-y-2 list-disc list-inside text-gray-600">
                  <li>Types de réclamations disponibles</li>
                  <li>Documents requis pour chaque type</li>
                  <li>Étapes de soumission d'une réclamation</li>
                  <li>Suivi de l'état des réclamations</li>
                  <li>Résolution des problèmes courants</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-[#f5901d] hover:bg-[#e07d0b]"
                  onClick={() => window.open('/docs/guide-reclamations.html', '_blank')}
                >
                  Consulter le guide
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Vidéos tutorielles</CardTitle>
                <CardDescription>
                  Apprenez visuellement avec nos guides vidéo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Nos vidéos tutorielles couvrent tous les aspects de la plateforme:
                </p>
                <ul className="space-y-2 list-disc list-inside text-gray-600">
                  <li>Visite guidée de l'interface</li>
                  <li>Comment utiliser le tableau de bord</li>
                  <li>Procédure de soumission des photos</li>
                  <li>Planification des rendez-vous</li>
                  <li>Gestion de votre profil</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-[#f5901d] hover:bg-[#e07d0b]">
                  Voir toutes les vidéos
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Références techniques</CardTitle>
                <CardDescription>
                  Informations sur la maintenance des VR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Ressources techniques pour comprendre l'entretien de votre VR:
                </p>
                <ul className="space-y-2 list-disc list-inside text-gray-600">
                  <li>Calendrier d'entretien recommandé</li>
                  <li>Conseils pour l'hivernisation</li>
                  <li>Maintenance préventive</li>
                  <li>Dépannage de base</li>
                  <li>Glossaire des termes techniques</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-[#f5901d] hover:bg-[#e07d0b]"
                  onClick={() => window.open('/docs/guide-technique.html', '_blank')}
                >
                  Consulter les références
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Guide de préparation saisonnière</CardTitle>
                <CardDescription>
                  Préparez votre VR pour chaque saison
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Ressources pour la préparation saisonnière de votre VR:
                </p>
                <ul className="space-y-2 list-disc list-inside text-gray-600">
                  <li>Préparation pour l'hiver (hivernisation)</li>
                  <li>Remise en service printanière</li>
                  <li>Entretien estival</li>
                  <li>Vérifications automnales</li>
                  <li>Conseils pour l'entreposage</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-[#f5901d] hover:bg-[#e07d0b]"
                  onClick={() => window.open('/docs/guide-saisonnier.html', '_blank')}
                >
                  Consulter le guide
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Manuel d'utilisation de l'application</CardTitle>
                <CardDescription>
                  Guide complet des fonctionnalités
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Documentation détaillée de toutes les fonctionnalités:
                </p>
                <ul className="space-y-2 list-disc list-inside text-gray-600">
                  <li>Navigation dans l'interface</li>
                  <li>Gestion des notifications</li>
                  <li>Paramètres du compte</li>
                  <li>Téléchargement de documents</li>
                  <li>Résolution des problèmes techniques</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-[#f5901d] hover:bg-[#e07d0b]"
                  onClick={() => window.open('/docs/guide-technique.html', '_blank')}
                >
                  Consulter le manuel
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}