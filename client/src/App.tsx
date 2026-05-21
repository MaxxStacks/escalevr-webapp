import { Switch, Route } from "wouter";
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
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/jobs" component={JobsPage} />
      <ProtectedRoute path="/jobs/new" component={JobNewPage} />
      <ProtectedRoute path="/jobs/:id" component={JobDetailPage} />
      <ProtectedRoute path="/schedule" component={SchedulePage} />
      <ProtectedRoute path="/units" component={UnitsPage} />
      <ProtectedRoute path="/units/new" component={UnitFormPage} />
      <ProtectedRoute path="/units/:id/edit" component={UnitFormPage} />
      <ProtectedRoute path="/clients" component={ClientsPage} />
      <ProtectedRoute path="/clients/new" component={ClientFormPage} />
      <ProtectedRoute path="/clients/:id/edit" component={ClientFormPage} />
      <ProtectedRoute path="/staff/new" component={StaffFormPage} />
      <ProtectedRoute path="/staff/:id/edit" component={StaffFormPage} />
      <ProtectedRoute path="/technicians" component={TechniciansPage} />
      <ProtectedRoute path="/service-agents" component={ServiceAgentsPage} />
      <ProtectedRoute path="/claim-agents" component={ClaimAgentsPage} />
      <ProtectedRoute path="/users" component={UserManagementPage} />
      <ProtectedRoute path="/chat" component={ChatPage} />
      <ProtectedRoute path="/chat/:roomId" component={ChatPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/support" component={SupportPage} />
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
