import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  PlusCircle, 
  Calendar, 
  Camera, 
  ClipboardCheck,
  HeartPulse,
  Settings as SettingsIcon,
  MessageSquare,
  Truck,
  Wrench,
  BadgeCheck,
  Phone
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// Traductions françaises
const translations = {
  "Quick Actions": "Actions rapides",
  "New Service Request": "Nouvelle demande de service",
  "Schedule Appointment": "Planifier un rendez-vous",
  "Upload Photos": "Téléverser des photos",
  "Submit Claim": "Soumettre une réclamation",
  "View My RVs": "Voir mes VR",
  "New Inspection": "Nouvelle inspection",
  "Complete Job": "Terminer un service",
  "Add Unit": "Ajouter un véhicule",
  "Approve Claim": "Approuver une réclamation",
  "Update Status": "Mettre à jour le statut",
  "Add Note": "Ajouter une note",
  "Contact Client": "Contacter un client",
  "Service History": "Historique de service",
  "Settings": "Paramètres",
  "Call Service": "Appeler le service"
};

type QuickAction = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

export default function QuickActions() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Actions spécifiques par rôle
  const roleActions: Record<string, QuickAction[]> = {
    client: [
      { 
        label: translations["New Service Request"], 
        icon: <PlusCircle className="h-5 w-5" />, 
        href: "/travaux/nouveau"
      },
      { 
        label: translations["Schedule Appointment"], 
        icon: <Calendar className="h-5 w-5" />, 
        href: "/calendrier"
      },
      { 
        label: translations["View My RVs"], 
        icon: <Truck className="h-5 w-5" />, 
        href: "/vehicules"
      },
      { 
        label: translations["Service History"], 
        icon: <FileText className="h-5 w-5" />, 
        href: "/travaux"
      },
      { 
        label: translations["Call Service"], 
        icon: <Phone className="h-5 w-5" />, 
        href: "tel:+14188335777"
      },
    ],
    technician: [
      { 
        label: translations["Update Status"], 
        icon: <Wrench className="h-5 w-5" />, 
        href: "/travaux"
      },
      { 
        label: translations["Upload Photos"], 
        icon: <Camera className="h-5 w-5" />, 
        href: "/travaux"
      },
      { 
        label: translations["New Inspection"], 
        icon: <ClipboardCheck className="h-5 w-5" />, 
        href: "/travaux/nouveau"
      },
      { 
        label: translations["Complete Job"], 
        icon: <BadgeCheck className="h-5 w-5" />, 
        href: "/travaux"
      },
    ],
    service: [
      { 
        label: translations["Add Unit"], 
        icon: <Truck className="h-5 w-5" />, 
        href: "/vehicules/nouveau"
      },
      { 
        label: translations["Schedule Appointment"], 
        icon: <Calendar className="h-5 w-5" />, 
        href: "/calendrier"
      },
      { 
        label: translations["Contact Client"], 
        icon: <MessageSquare className="h-5 w-5" />, 
        href: "/clients"
      },
      { 
        label: translations["New Service Request"], 
        icon: <FileText className="h-5 w-5" />, 
        href: "/travaux/nouveau"
      },
    ],
    claim_agent: [
      { 
        label: translations["Approve Claim"], 
        icon: <BadgeCheck className="h-5 w-5" />, 
        href: "/claims"
      },
      { 
        label: translations["Submit Claim"], 
        icon: <HeartPulse className="h-5 w-5" />, 
        href: "/claims/new"
      },
      { 
        label: translations["Contact Client"], 
        icon: <MessageSquare className="h-5 w-5" />, 
        href: "/clients"
      },
      { 
        label: translations["Upload Photos"], 
        icon: <Camera className="h-5 w-5" />, 
        href: "/travaux"
      },
    ],
    admin: [
      { 
        label: translations["New Service Request"], 
        icon: <PlusCircle className="h-5 w-5" />, 
        href: "/travaux/nouveau"
      },
      { 
        label: translations["Schedule Appointment"], 
        icon: <Calendar className="h-5 w-5" />, 
        href: "/calendrier"
      },
      { 
        label: translations["Add Unit"], 
        icon: <Truck className="h-5 w-5" />, 
        href: "/vehicules/nouveau"
      },
      { 
        label: translations["Settings"], 
        icon: <SettingsIcon className="h-5 w-5" />, 
        href: "/parametres"
      },
    ]
  };

  // Utiliser le rôle de l'utilisateur pour afficher les actions appropriées
  const actions = user?.role ? roleActions[user.role] || roleActions.client : roleActions.client;

  return (
    <div className="mb-8">
      <h2 className="text-lg font-medium mb-4">{translations["Quick Actions"]}</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="flex-col h-24 justify-center items-center space-y-2 transition-all bg-[#f5901d]/10 text-[#f5901d] dark:bg-[#f5901d]/30 dark:text-[#f5901d] hover:bg-[#465c50]/10 hover:text-[#465c50] dark:hover:bg-[#465c50]/30 dark:hover:text-[#465c50]/90"
            onClick={() => navigate(action.href)}
          >
            {action.icon}
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}