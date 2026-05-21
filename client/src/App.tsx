import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import JobsPage from "@/pages/jobs-page";
import JobNewPage from "@/pages/job-new-page";
import JobDetailPage from "@/pages/job-detail-page";
import SchedulePage from "@/pages/schedule-page";
import UnitsPage from "@/pages/units-page";
import UnitFormPage from "@/pages/unit-form-page";
import ClientFormPage from "@/pages/client-form-page";
import ClientsPage from "@/pages/clients-page";
import StaffFormPage from "@/pages/staff-form-page";
import TechniciansPage from "@/pages/technicians-page";
import ServiceAgentsPage from "@/pages/service-agents-page";
import ClaimAgentsPage from "@/pages/claim-agents-page";
import FinanceAgentsPage from "@/pages/finance-agents-page";
import UserManagementPage from "@/pages/user-management-page";
import SettingsPage from "@/pages/settings-page";
import SupportPage from "@/pages/support-page";
import ChatPage from "@/pages/chat-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth"><Redirect to="/connexion" /></Route>
      <Route path="/connexion" component={AuthPage} />
      <ProtectedRoute path="/tableau-de-bord" component={DashboardPage} />
      <ProtectedRoute path="/travaux" component={JobsPage} />
      <ProtectedRoute path="/travaux/nouveau" component={JobNewPage} />
      <ProtectedRoute path="/travaux/:id" component={JobDetailPage} />
      <ProtectedRoute path="/calendrier" component={SchedulePage} />
      <ProtectedRoute path="/vehicules" component={UnitsPage} />
      <ProtectedRoute path="/vehicules/nouveau" component={UnitFormPage} />
      <ProtectedRoute path="/vehicules/:id/modifier" component={UnitFormPage} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/clients/nouveau" component={ClientFormPage} />
      <ProtectedRoute path="/clients/:id/modifier" component={ClientFormPage} />
      <ProtectedRoute path="/employes/nouveau" component={StaffFormPage} />
      <ProtectedRoute path="/employes/:id/modifier" component={StaffFormPage} />
      <ProtectedRoute path="/techniciens" component={TechniciansPage} />
      <ProtectedRoute path="/agents-service" component={ServiceAgentsPage} />
      <ProtectedRoute path="/agents-reclamation" component={ClaimAgentsPage} />
      <ProtectedRoute path="/agents-financement" component={FinanceAgentsPage} />
      <ProtectedRoute path="/utilisateurs" component={UserManagementPage} />
      <ProtectedRoute path="/messagerie" component={ChatPage} />
      <ProtectedRoute path="/messagerie/:roomId" component={ChatPage} />
      <ProtectedRoute path="/parametres" component={SettingsPage} />
      <ProtectedRoute path="/assistance" component={SupportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Router />
      </AuthProvider>
    </TooltipProvider>
  );
}

export default App;
