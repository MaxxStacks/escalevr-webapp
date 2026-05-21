import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  LayoutDashboard,
  Wrench,
  Calendar,
  Truck,
  Users,
  User,
  Settings,
  HelpCircle,
  LogOut,
  MessageSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import escaleLogo from "../../assets/escale-logo-dark.png";

const translations = {
  "Dashboard": "Tableau de bord",
  "Jobs": "Services",
  "Schedule": "Calendrier",
  "Units": "Véhicules",
  "Clients": "Client",
  "Technicians": "Technicien",
  "Service": "Service",
  "Claims": "Réclamation",
  "Users": "Utilisateur",
  "Settings": "Paramètres",
  "Help & Support": "Aide & Support"
};

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const { data: notifications = [] } = useQuery<{ id: number; type: string; title: string; isRead: boolean }[]>({
    queryKey: ["/api/notifications"],
    queryFn: () => apiRequest("GET", "/api/notifications").then(r => r.json()),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const unreadMessages = notifications.filter(n => !n.isRead && n.title?.includes("vous a envoyé un message")).length;

  const getNavItems = () => {
    const mainItems = [
      { path: "/dashboard", label: translations["Dashboard"], icon: <LayoutDashboard className="h-5 w-5" /> },
      { path: "/jobs", label: translations["Jobs"], icon: <Wrench className="h-5 w-5" /> },
      { path: "/schedule", label: translations["Schedule"], icon: <Calendar className="h-5 w-5" /> },
      { path: "/units", label: translations["Units"], icon: <Truck className="h-5 w-5" /> },
    ];

    const userItems = [];
    
    if (user?.role === "admin") {
      userItems.push(
        { path: "/users?role=admin", label: "Admin", icon: <User className="h-5 w-5" /> }
      );
    }
    
    if (["admin", "service"].includes(user?.role as string)) {
      userItems.push(
        { path: "/clients", label: translations["Clients"], icon: <Users className="h-5 w-5" /> }
      );
    }
    
    if (user?.role === "admin") {
      userItems.push(
        { path: "/service-agents", label: translations["Service"], icon: <Users className="h-5 w-5" /> }
      );
    }
    
    if (["admin", "service"].includes(user?.role as string)) {
      userItems.push(
        { path: "/technicians", label: translations["Technicians"], icon: <User className="h-5 w-5" /> }
      );
    }
    
    if (user?.role === "admin") {
      userItems.push(
        { path: "/claim-agents", label: translations["Claims"], icon: <Users className="h-5 w-5" /> },
        { path: "/finance-agents", label: "Financement", icon: <Users className="h-5 w-5" /> },
        { path: "/users", label: "Tous les utilisateurs", icon: <Users className="h-5 w-5" /> }
      );
    }

    const settingsItem = [
      { path: "/settings", label: translations["Settings"], icon: <Settings className="h-5 w-5" /> }
    ];

    return { mainItems, userItems, settingsItem };
  };

  const { mainItems, userItems, settingsItem } = getNavItems();

  const handleLogoutConfirm = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/auth";
      }
    });
    setShowLogoutDialog(false);
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'admin': 'Administrateur',
      'claim_agent': 'Agent de réclamation',
      'technician': 'Technicien',
      'service': 'Service',
      'client': 'Client',
      'financement': 'Financement',
    };
    return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  return (
    <>
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-md">
        {/* Logo area */}
        <div className="p-5 border-b border-gray-200 dark:border-gray-700 bg-primary/5">
          <div className="flex flex-col items-center">
            <img src={escaleLogo} alt="Escale VR" className="h-14 mb-3" />
            <h1 className="text-lg font-bold text-primary dark:text-white">
              GestionVR
            </h1>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <div className="mb-2">
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Menu Principal
            </h2>
          </div>

          {mainItems.map((item) => (
            <div 
              key={item.path} 
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                location === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="mr-3 text-current">{item.icon}</span>
              {item.label}
            </div>
          ))}

          {userItems.length > 0 && (
            <>
              <div className="mt-8 mb-2">
                <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {translations["Users"]}
                </h2>
              </div>
              
              {userItems.map((item) => (
                <div 
                  key={item.path} 
                  className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    location === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-primary/10 hover:text-primary"
                  }`}
                  onClick={() => handleNavigation(item.path)}
                >
                  <span className="mr-3 text-current">{item.icon}</span>
                  {item.label}
                </div>
              ))}
            </>
          )}

          <div className="mt-8 mb-2">
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Support
            </h2>
          </div>
          
          <div 
            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              location === "/support"
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-primary/10 hover:text-primary"
            }`}
            onClick={() => handleNavigation("/support")}
          >
            <HelpCircle className="h-5 w-5 mr-3" />
            {translations["Help & Support"]}
          </div>
          
          <div
            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              location.startsWith("/chat")
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-primary/10 hover:text-primary"
            }`}
            onClick={() => handleNavigation("/chat")}
          >
            <MessageSquare className="h-5 w-5 mr-3" />
            Messagerie
            {unreadMessages > 0 && (
              <Badge className="ml-auto bg-[#f5901d] text-white text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </Badge>
            )}
          </div>

          <div className="mt-8 mb-2">
            <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Paramètres
            </h2>
          </div>
          
          {settingsItem.map((item) => (
            <div 
              key={item.path} 
              className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                location === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-primary/10 hover:text-primary"
              }`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="mr-3 text-current">{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-primary/5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-secondary/20 text-secondary flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full rounded-full" />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-foreground">{user?.fullName || 'Utilisateur'}</p>
              <p className="text-xs text-muted-foreground">{user?.role ? getRoleDisplay(user.role) : ''}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowLogoutDialog(true)}
              className="ml-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Déconnexion</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Se déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
