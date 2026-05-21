import { useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  MessageSquare,
  Wrench,
  Calendar,
  Truck,
  Users,
  User,
  Settings,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId: number | null;
  createdAt: string;
}

const translations = {
  "Search for jobs, units, or clients...": "Rechercher des services, véhicules ou clients...",
  "Dashboard": "Tableau de bord",
  "Jobs": "Services",
  "Schedule": "Calendrier",
  "Units": "Véhicules",
  "Clients": "Clients",
  "Technicians": "Techniciens",
  "Settings": "Paramètres",
  "Help & Support": "Aide & Support",
  "Logout": "Déconnexion",
  "Notifications": "Notifications",
  "Profile": "Profil",
  "Service Portal": "Portail de Service"
};

export default function Header({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    queryFn: () => apiRequest("GET", "/api/notifications").then(r => r.json()),
    refetchInterval: 30000,
    enabled: !!user,
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markReadMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const markOneMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/notifications/read/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const handleNotificationClick = (n: Notification) => {
    markOneMutation.mutate(n.id);
    if (n.title?.includes("vous a envoyé un message") && n.relatedId) {
      window.location.href = `/messagerie/${n.relatedId}`;
    } else if (n.type === "job" && n.relatedId) {
      window.location.href = `/travaux`;
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
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

  const handleMobileMenuToggle = () => {
    setShowMobileMenu(!showMobileMenu);
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  };

  const navItems = [
    { path: "/tableau-de-bord", label: translations["Dashboard"], icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: "/travaux", label: translations["Jobs"], icon: <Wrench className="h-5 w-5" /> },
    { path: "/calendrier", label: translations["Schedule"], icon: <Calendar className="h-5 w-5" /> },
    { path: "/vehicules", label: translations["Units"], icon: <Truck className="h-5 w-5" /> },
  ];

  if (["admin", "service"].includes(user?.role as string)) {
    navItems.push(
      { path: "/clients", label: translations["Clients"], icon: <Users className="h-5 w-5" /> },
      { path: "/techniciens", label: translations["Technicians"], icon: <User className="h-5 w-5" /> }
    );
  }

  navItems.push({ path: "/parametres", label: translations["Settings"], icon: <Settings className="h-5 w-5" /> });

  const handleLogoutConfirm = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.href = "/connexion";
      }
    });
    setShowLogoutDialog(false);
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-sm z-10 border-b border-border">
        <div className="px-4 py-3 md:px-6 flex items-center justify-between">
          {/* Mobile Logo & Menu Button */}
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" onClick={handleMobileMenuToggle} className="text-muted-foreground hover:text-foreground">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="ml-3 flex items-center">
              <img src={escaleLogo} alt="Escale VR" className="h-8" />
              <span className="ml-2 text-lg font-semibold text-primary">
                GestionVR
              </span>
            </div>
          </div>

          {/* Page Title - Desktop */}
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-foreground">
              {location === '/' || location === '/tableau-de-bord'
                ? translations["Dashboard"] 
                : navItems.find(item => item.path === location)?.label || 'GestionVR'}
            </h1>
          </div>

          {/* Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-md mx-5">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input 
                type="text" 
                className="pl-9 bg-muted/50 border-muted focus:bg-background" 
                placeholder={translations["Search for jobs, units, or clients..."]}
              />
            </div>
          </div>

          {/* Desktop Right Navigation */}
          <div className="flex items-center space-x-1 md:space-x-2">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full">
              <HelpCircle className="h-5 w-5" />
            </Button>
            
            <DropdownMenu onOpenChange={(open) => { if (open && unreadCount > 0) markReadMutation.mutate(); }}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground hover:bg-primary/10 rounded-full">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#f5901d] text-[9px] font-bold text-white ring-2 ring-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">{unreadCount} non lues</Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Aucune notification
                  </div>
                ) : (
                  <ScrollArea className="max-h-72">
                    {notifications.slice(0, 20).map(n => (
                      <DropdownMenuItem
                        key={n.id}
                        className={`flex flex-col items-start gap-0.5 cursor-pointer px-3 py-2 ${!n.isRead ? "bg-primary/5" : ""}`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <span className={`text-sm ${!n.isRead ? "font-semibold" : "font-normal"}`}>{n.title}</span>
                        <span className="text-xs text-muted-foreground">{n.message}</span>
                      </DropdownMenuItem>
                    ))}
                  </ScrollArea>
                )}
                {notifications.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-xs text-center justify-center text-muted-foreground"
                      onClick={() => markReadMutation.mutate()}
                    >
                      <CheckCheck className="h-3 w-3 mr-1" />
                      Tout marquer comme lu
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 border-2 border-primary/10">
                    {user?.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                    ) : (
                      <AvatarFallback className="bg-secondary/20 text-secondary font-medium">
                        {user?.fullName ? getInitials(user.fullName) : 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.role ? getRoleDisplay(user.role) : ''}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.location.href = '/parametres'}>
                  <User className="mr-2 h-4 w-4" />
                  <span>{translations["Profile"]}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setShowLogoutDialog(true)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{translations["Logout"]}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
              <SheetContent side="left" className="w-[280px]">
                <div className="flex flex-col h-full py-6">
                  <div className="flex flex-col items-center justify-center mb-8">
                    <img src={escaleLogo} alt="Escale VR" className="h-10 mb-2" />
                    <h3 className="text-lg font-semibold">GestionVR</h3>
                  </div>
                  
                  <div className="flex flex-col space-y-1 mb-4">
                    <div className="flex items-center space-x-3 px-2 py-2">
                      <Avatar className="h-10 w-10">
                        {user?.avatarUrl ? (
                          <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                        ) : (
                          <AvatarFallback className="bg-secondary/20 text-secondary">
                            {user?.fullName ? getInitials(user.fullName) : 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <h3 className="text-sm font-medium">{user?.fullName}</h3>
                        <p className="text-xs text-muted-foreground">
                          {user?.role ? getRoleDisplay(user.role) : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 flex-1">
                    {navItems.map((item) => (
                      <a 
                        key={item.path} 
                        href={item.path}
                        className={`flex items-center px-2 py-2 text-base ${
                          location === item.path
                            ? "text-primary font-medium"
                            : "text-foreground hover:text-primary"
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = item.path;
                          setShowMobileMenu(false);
                        }}
                      >
                        <span className="mr-3">{item.icon}</span>
                        {item.label}
                      </a>
                    ))}
                    
                    <div className="my-4 border-t border-border"></div>
                    
                    <a
                      href="/messagerie"
                      className={`flex items-center px-2 py-2 text-base ${
                        location === "/messagerie"
                          ? "text-primary font-medium"
                          : "text-foreground hover:text-primary"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = "/messagerie";
                        setShowMobileMenu(false);
                      }}
                    >
                      <MessageSquare className="mr-3 h-5 w-5" />
                      Messagerie
                    </a>

                    <a
                      href="/assistance"
                      className={`flex items-center px-2 py-2 text-base ${
                        location === "/assistance"
                          ? "text-primary font-medium"
                          : "text-foreground hover:text-primary"
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = "/assistance";
                        setShowMobileMenu(false);
                      }}
                    >
                      <HelpCircle className="mr-3 h-5 w-5" />
                      {translations["Help & Support"]}
                    </a>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button 
                      variant="ghost" 
                      className="flex items-center w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setShowMobileMenu(false);
                        setShowLogoutDialog(true);
                      }}
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      {translations["Logout"]}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

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
