import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import StatsCard from "@/components/dashboard/stats-card";
import JobCard from "@/components/dashboard/job-card";
import TechnicianCard from "@/components/dashboard/technician-card";
import CalendarView from "@/components/dashboard/calendar-view";
import ClaimsTable from "@/components/dashboard/claims-table";
import NotificationCard from "@/components/dashboard/notification-card";
import QuickActions from "@/components/dashboard/quick-actions";
import ProgressGamification from "@/components/dashboard/progress-gamification";
import { 
  Loader2, 
  RotateCw, 
  ArrowRight, 
  RefreshCw,
  Wrench, 
  Calendar, 
  Truck, 
  AlertTriangle,
  CheckCircle2,
  FileText,
  Cog 
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// French translations
export const translations = {
  "Dashboard": "Tableau de bord",
  "Welcome back": "Bienvenue",
  "Here's an overview of the service operations": "Voici un aperçu des opérations de service",
  "Total Jobs": "Services totaux",
  "Active Jobs": "Services actifs",
  "Completed Jobs": "Services terminés",
  "Your RVs": "Vos VR",
  "Your service history": "Votre historique de service",
  "Currently in progress": "En cours",
  "Successfully completed": "Terminés avec succès",
  "Registered units": "Véhicules enregistrés",
  "Scheduled Jobs": "Services programmés",
  "Units in Shop": "Véhicules en atelier", 
  "Pending Approvals": "Approbations en attente",
  "from last week": "par rapport à la semaine dernière",
  "Same as last week": "Identique à la semaine dernière",
  "new today": "nouveaux aujourd'hui",
  "Your Jobs": "Vos services",
  "Today's Jobs": "Services du jour",
  "All Jobs": "Tous les services",
  "Warranty": "Garantie",
  "Insurance": "Assurance",
  "Service": "Service",
  "PDI": "Inspection PDI",
  "No jobs found": "Aucun service trouvé",
  "View all jobs": "Voir tous les services",
  "Technician Status": "Statut des techniciens",
  "No technicians available": "Aucun technicien disponible",
  "Failed to load dashboard data": "Échec du chargement des données",
  "Please try refreshing the page": "Veuillez rafraîchir la page",
  "Refresh": "Actualiser",
  "Claims": "Réclamations",
  "Notifications": "Notifications",
  "Calendar": "Calendrier",
  "Today": "Aujourd'hui",
  "This Month": "Ce mois-ci",
  "Loading": "Chargement en cours",
  "Error": "Erreur",
  "Upcoming Schedule": "Calendrier à venir",
  "Full Calendar": "Calendrier complet",
  "Upcoming Appointments": "Rendez-vous à venir",
  "January": "Janvier",
  "February": "Février", 
  "March": "Mars", 
  "April": "Avril", 
  "May": "Mai", 
  "June": "Juin", 
  "July": "Juillet", 
  "August": "Août", 
  "September": "Septembre", 
  "October": "Octobre", 
  "November": "Novembre", 
  "December": "Décembre",
  "Sun": "Dim",
  "Mon": "Lun",
  "Tue": "Mar",
  "Wed": "Mer",
  "Thu": "Jeu",
  "Fri": "Ven",
  "Sat": "Sam",
};

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard"],
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-full p-6">
          <div className="bg-destructive/10 rounded-full p-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-destructive mb-2">
            {translations["Failed to load dashboard data"]}
          </h1>
          <p className="text-muted-foreground">
            {translations["Please try refreshing the page"]}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {translations["Refresh"]}
          </Button>
        </div>
      </Layout>
    );
  }

  const { stats, recentJobs, technicianStatus, pendingClaims } = data || {
    stats: {},
    recentJobs: [],
    technicianStatus: [],
    pendingClaims: []
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {translations["Dashboard"]}
        </h1>
        <p className="text-muted-foreground mt-1">
          {translations["Welcome back"]}{user?.fullName ? `, ${user.fullName}` : ''}! {translations["Here's an overview of the service operations"]}.
        </p>
      </div>
      
      {/* Quick Actions */}
      <QuickActions />
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {user?.role === 'client' ? (
          // Client stats
          <>
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations["Total Jobs"]}
                  </CardTitle>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalJobs || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {translations["Your service history"]}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations["Active Jobs"]}
                  </CardTitle>
                  <div className="bg-secondary/10 p-2 rounded-full">
                    <Wrench className="h-4 w-4 text-secondary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeJobs || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {translations["Currently in progress"]}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations["Completed Jobs"]}
                  </CardTitle>
                  <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedJobs || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {translations["Successfully completed"]}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations["Your RVs"]}
                  </CardTitle>
                  <div className="bg-blue-100 dark:bg-blue-900/20 p-2 rounded-full">
                    <Truck className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUnits || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {translations["Registered units"]}
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          // Admin/Service/Tech stats
          <>
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations["Active Jobs"]}
                  </CardTitle>
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Wrench className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeJobs || 0}</div>
                <div className="flex items-center mt-1">
                  <span className="flex items-center text-xs text-green-500">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 6.5L5 9L9.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    12% 
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {translations["from last week"]}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-secondary">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations["Scheduled Jobs"]}
                  </CardTitle>
                  <div className="bg-secondary/10 p-2 rounded-full">
                    <Calendar className="h-4 w-4 text-secondary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.scheduledJobs || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {translations["Same as last week"]}
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations["Units in Shop"]}
                  </CardTitle>
                  <div className="bg-green-100 dark:bg-green-900/20 p-2 rounded-full">
                    <Truck className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unitsInShop || 0}</div>
                <div className="flex items-center mt-1">
                  <span className="flex items-center text-xs text-green-500">
                    <svg className="w-3 h-3 mr-1" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 6.5L5 9L9.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    8% 
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {translations["from last week"]}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-destructive">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {translations["Pending Approvals"]}
                  </CardTitle>
                  <div className="bg-destructive/10 p-2 rounded-full">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingApprovals || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-destructive">3</span> {translations["new today"]}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Jobs Overview and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Jobs Column */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {user?.role === 'client' ? translations["Your Jobs"] : translations["Today's Jobs"]}
                </CardTitle>
                <CardDescription className="mt-1">
                  {recentJobs.length > 0 
                    ? `${recentJobs.length} service(s)` 
                    : translations["No jobs found"]}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder={translations["All Jobs"]} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{translations["All Jobs"]}</SelectItem>
                    <SelectItem value="warranty">{translations["Warranty"]}</SelectItem>
                    <SelectItem value="insurance">{translations["Insurance"]}</SelectItem>
                    <SelectItem value="service">{translations["Service"]}</SelectItem>
                    <SelectItem value="pdi">{translations["PDI"]}</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon">
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <Separator />
            
            <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
              <ul className="divide-y divide-border">
                {recentJobs.length > 0 ? (
                  recentJobs.map((job) => (
                    <JobCard key={job.id} job={job} />
                  ))
                ) : (
                  <li className="p-8 text-center text-muted-foreground">
                    {translations["No jobs found"]}
                  </li>
                )}
              </ul>
            </div>
            
            <CardFooter className="flex justify-center p-4 bg-muted/30">
              <Button variant="ghost" className="text-primary" asChild>
                <a href="/jobs" className="flex items-center">
                  {translations["View all jobs"]}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Tech Status & Calendar */}
        <div className="lg:col-span-5">
          <div className="space-y-6">
            {/* Technician Status - only for admin/service roles */}
            {user?.role !== 'client' && (
              <Card>
                <CardHeader>
                  <CardTitle>{translations["Technician Status"]}</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <ul className="space-y-3">
                    {technicianStatus.length > 0 ? (
                      technicianStatus.map((tech) => (
                        <TechnicianCard key={tech.id} technician={tech} />
                      ))
                    ) : (
                      <li className="text-center py-4 text-muted-foreground">
                        {translations["No technicians available"]}
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}
            
            {/* Calendar View */}
            <CalendarView />
          </div>
        </div>
      </div>
      
      {/* Only show claims for admin/service/claim_agent */}
      {['admin', 'service', 'claim_agent'].includes(user?.role as string) && pendingClaims.length > 0 && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Claims Table */}
          <div className="lg:col-span-7">
            <ClaimsTable claims={pendingClaims} />
          </div>
          
          {/* Notifications */}
          <div className="lg:col-span-5">
            <NotificationCard />
          </div>
        </div>
      )}
    </Layout>
  );
}
