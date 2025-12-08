import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Trophy, Award, Star, Zap, Target, Crown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

// Traductions françaises
const translations = {
  "Service Achievement": "Réalisation de service",
  "Level": "Niveau",
  "Experience Points": "Points d'expérience",
  "Current Level": "Niveau actuel",
  "Next Level": "Niveau suivant",
  "Completed Services": "Services complétés",
  "Achievement Unlocked": "Réalisation débloquée",
  "Recent Achievement": "Réalisation récente",
  "Technician Performance": "Performance du technicien",
  "Efficiency Rating": "Indice d'efficacité",
  "Claim Processing": "Traitement des réclamations",
  "Success Rate": "Taux de réussite",
  "Resolution Time": "Temps de résolution",
  "Client Satisfaction": "Satisfaction client",
  "Service Quality": "Qualité de service",
  "Master Technician": "Technicien maître",
  "Claims Expert": "Expert en réclamations",
  "Service Excellence": "Excellence de service",
  "Premium Client": "Client premium",
  "days": "jours",
  "hrs": "hrs",
  "jobs": "services",
  "Experience": "Expérience",
  "Stats": "Statistiques",
};

// Badges et récompenses selon les rôles
const roleBadges = {
  technician: [
    { title: "Premier diagnostic", icon: <Award className="h-5 w-5 text-amber-500" />, level: 1 },
    { title: "10 réparations", icon: <Star className="h-5 w-5 text-blue-500" />, level: 2 },
    { title: "Technicien senior", icon: <Zap className="h-5 w-5 text-purple-500" />, level: 3 },
    { title: "Technicien expert", icon: <Trophy className="h-5 w-5 text-yellow-500" />, level: 4 },
    { title: translations["Master Technician"], icon: <Crown className="h-5 w-5 text-indigo-500" />, level: 5 },
  ],
  claim_agent: [
    { title: "Premier dossier", icon: <Award className="h-5 w-5 text-amber-500" />, level: 1 },
    { title: "10 réclamations", icon: <Star className="h-5 w-5 text-blue-500" />, level: 2 },
    { title: "Agent senior", icon: <Zap className="h-5 w-5 text-purple-500" />, level: 3 },
    { title: "Agent expérimenté", icon: <Trophy className="h-5 w-5 text-yellow-500" />, level: 4 },
    { title: translations["Claims Expert"], icon: <Crown className="h-5 w-5 text-indigo-500" />, level: 5 },
  ],
  service: [
    { title: "Premier client", icon: <Award className="h-5 w-5 text-amber-500" />, level: 1 },
    { title: "10 services", icon: <Star className="h-5 w-5 text-blue-500" />, level: 2 },
    { title: "Service senior", icon: <Zap className="h-5 w-5 text-purple-500" />, level: 3 },
    { title: "Service expert", icon: <Trophy className="h-5 w-5 text-yellow-500" />, level: 4 },
    { title: translations["Service Excellence"], icon: <Crown className="h-5 w-5 text-indigo-500" />, level: 5 },
  ],
  client: [
    { title: "Premier service", icon: <Award className="h-5 w-5 text-amber-500" />, level: 1 },
    { title: "Client régulier", icon: <Star className="h-5 w-5 text-blue-500" />, level: 2 },
    { title: "Client fidèle", icon: <Zap className="h-5 w-5 text-purple-500" />, level: 3 },
    { title: "Client VIP", icon: <Trophy className="h-5 w-5 text-yellow-500" />, level: 4 },
    { title: translations["Premium Client"], icon: <Crown className="h-5 w-5 text-indigo-500" />, level: 5 },
  ],
  admin: [
    { title: "Administrateur débutant", icon: <Award className="h-5 w-5 text-amber-500" />, level: 1 },
    { title: "Administrateur actif", icon: <Star className="h-5 w-5 text-blue-500" />, level: 2 },
    { title: "Administrateur senior", icon: <Zap className="h-5 w-5 text-purple-500" />, level: 3 },
    { title: "Administrateur expert", icon: <Trophy className="h-5 w-5 text-yellow-500" />, level: 4 },
    { title: "Administrateur maître", icon: <Crown className="h-5 w-5 text-indigo-500" />, level: 5 },
  ]
};

// Simulations pour les données de démonstration
function calculateLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function calculateXPForNextLevel(level: number): number {
  return level * 100;
}

export default function ProgressGamification() {
  const { user } = useAuth();
  const [animateProgress, setAnimateProgress] = useState(0);

  // Simuler les données de progression (En production, ces données proviendraient du backend)
  // Note: Ceci serait remplacé par une requête d'API réelle
  const { data } = useQuery<{
    xp: number;
    level: number;
    nextLevelXP: number;
    progress: number;
    completedServices: number;
    efficiencyRating?: number;
    averageResolutionTime?: number;
    totalJobs?: number;
    successRate?: number;
    processingTime?: number;
    totalClaims?: number;
    clientSatisfaction?: number;
    responseTime?: number;
    totalClients?: number;
    serviceQuality?: number;
    lastServiceDays?: number;
    totalUnits?: number;
    systemUptime?: number;
    totalUsers?: number;
    activeJobs?: number;
  }>({
    queryKey: ["/api/user-stats"],
    queryFn: async () => {
      // Simulation des statistiques selon le rôle
      let xp = Math.floor(Math.random() * 480) + 20;
      const completedServices = Math.floor(xp / 20);
      const level = calculateLevel(xp);
      const nextLevelXP = calculateXPForNextLevel(level);
      const progress = (xp % 100) / 100 * 100;
      
      let result = {
        xp,
        level,
        nextLevelXP,
        progress,
        completedServices
      };
      
      // Ajouter les statistiques spécifiques au rôle
      if (user?.role === 'technician') {
        return {
          ...result,
          efficiencyRating: Math.floor(Math.random() * 30) + 70,
          averageResolutionTime: Math.floor(Math.random() * 5) + 1,
          totalJobs: completedServices
        };
      } else if (user?.role === 'claim_agent') {
        return {
          ...result,
          successRate: Math.floor(Math.random() * 20) + 80,
          processingTime: Math.floor(Math.random() * 3) + 1,
          totalClaims: completedServices
        };
      } else if (user?.role === 'service') {
        return {
          ...result,
          clientSatisfaction: Math.floor(Math.random() * 15) + 85,
          responseTime: Math.floor(Math.random() * 24) + 1,
          totalClients: Math.floor(completedServices / 2)
        };
      } else if (user?.role === 'client') {
        return {
          ...result,
          serviceQuality: Math.floor(Math.random() * 10) + 90,
          lastServiceDays: Math.floor(Math.random() * 30) + 1,
          totalUnits: Math.floor(Math.random() * 3) + 1
        };
      } else {
        return {
          ...result,
          systemUptime: Math.floor(Math.random() * 5) + 95,
          totalUsers: Math.floor(Math.random() * 50) + 10,
          activeJobs: Math.floor(Math.random() * 15) + 5
        };
      }
    },
    enabled: !!user,
    initialData: {
      xp: 0,
      level: 1,
      nextLevelXP: 100,
      progress: 0,
      completedServices: 0
    }
  });

  // Animation de la barre de progression
  useEffect(() => {
    if (data?.progress) {
      const timer = setTimeout(() => {
        setAnimateProgress(data.progress);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [data?.progress]);

  if (!user || !data) return null;
  
  // Obtenir les badges spécifiques au rôle
  const badges = roleBadges[user.role as keyof typeof roleBadges] || roleBadges.client;
  const currentBadge = badges.find(badge => badge.level === data.level) || badges[0];
  
  const renderRoleSpecificStats = () => {
    switch (user.role) {
      case 'technician':
        return (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">{translations["Efficiency Rating"]}</p>
              <div className="flex items-center">
                <Target className="h-5 w-5 text-blue-500 mr-2" />
                <Progress value={data.efficiencyRating} className="h-2" />
                <span className="ml-2 text-sm font-medium">{data.efficiencyRating}%</span>
              </div>
            </div>
            <div className="space-y-2 mt-3">
              <p className="text-sm font-medium">{translations["Resolution Time"]}</p>
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-amber-500 mr-2" />
                <span className="text-sm">{data.averageResolutionTime} jours</span>
              </div>
            </div>
          </>
        );
      case 'claim_agent':
        return (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">{translations["Success Rate"]}</p>
              <div className="flex items-center">
                <Trophy className="h-5 w-5 text-emerald-500 mr-2" />
                <Progress value={data.successRate} className="h-2" />
                <span className="ml-2 text-sm font-medium">{data.successRate}%</span>
              </div>
            </div>
            <div className="space-y-2 mt-3">
              <p className="text-sm font-medium">{translations["Resolution Time"]}</p>
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-amber-500 mr-2" />
                <span className="text-sm">{data.processingTime} jours</span>
              </div>
            </div>
          </>
        );
      case 'service':
        return (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">{translations["Client Satisfaction"]}</p>
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                <Progress value={data.clientSatisfaction} className="h-2" />
                <span className="ml-2 text-sm font-medium">{data.clientSatisfaction}%</span>
              </div>
            </div>
            <div className="space-y-2 mt-3">
              <p className="text-sm font-medium">Temps de réponse</p>
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm">{data.responseTime} heures</span>
              </div>
            </div>
          </>
        );
      case 'client':
        return (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">{translations["Service Quality"]}</p>
              <div className="flex items-center">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                <Progress value={data.serviceQuality} className="h-2" />
                <span className="ml-2 text-sm font-medium">{data.serviceQuality}%</span>
              </div>
            </div>
            <div className="space-y-2 mt-3">
              <p className="text-sm font-medium">Dernier service</p>
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-emerald-500 mr-2" />
                <span className="text-sm">Il y a {data.lastServiceDays} jours</span>
              </div>
            </div>
          </>
        );
      case 'admin':
      default:
        return (
          <>
            <div className="space-y-2">
              <p className="text-sm font-medium">Disponibilité système</p>
              <div className="flex items-center">
                <Star className="h-5 w-5 text-emerald-500 mr-2" />
                <Progress value={data.systemUptime} className="h-2" />
                <span className="ml-2 text-sm font-medium">{data.systemUptime}%</span>
              </div>
            </div>
            <div className="space-y-2 mt-3">
              <p className="text-sm font-medium">Services actifs</p>
              <div className="flex items-center">
                <Zap className="h-5 w-5 text-blue-500 mr-2" />
                <span className="text-sm">{data.activeJobs} services</span>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {currentBadge.icon}
          <span className="ml-2">{currentBadge.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{translations["Level"]} {data.level}</span>
              <span className="text-xs text-muted-foreground">
                {data.xp}/{data.nextLevelXP} XP
              </span>
            </div>
            <div className="relative">
              <Progress value={animateProgress} className="h-2" />
              <span className="absolute right-0 -bottom-4 text-xs text-muted-foreground">
                {translations["Level"]} {data.level + 1}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-1 pt-4">
            <span className="text-xs font-medium uppercase text-muted-foreground">
              {translations["Stats"]}
            </span>
          </div>
          
          <div className="grid gap-4">
            <div className="flex items-center">
              <div className="mr-4 rounded-full bg-primary/10 p-2">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{translations["Completed Services"]}</p>
                <p className="text-sm text-muted-foreground">
                  {data.completedServices} {translations["jobs"]}
                </p>
              </div>
            </div>
            
            {renderRoleSpecificStats()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}