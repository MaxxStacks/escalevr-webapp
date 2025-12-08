import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Check, 
  AlertTriangle, 
  Hourglass, 
  RefreshCw,
  LucideIcon
} from "lucide-react";

interface StatusBadgeProps {
  status: string;
}

type StatusConfig = {
  label: string;
  color: string;
  bgColor: string;
  hoverColor: string;
  icon: LucideIcon;
}

const getStatusConfig = (status: string): StatusConfig => {
  const statusMap: Record<string, StatusConfig> = {
    "scheduled": {
      label: "Scheduled",
      color: "text-blue-700",
      bgColor: "bg-blue-100", 
      hoverColor: "hover:bg-blue-200",
      icon: Clock
    },
    "in_progress": {
      label: "In Progress",
      color: "text-amber-700",
      bgColor: "bg-amber-100",
      hoverColor: "hover:bg-amber-200",
      icon: RefreshCw
    },
    "awaiting_parts": {
      label: "Awaiting Parts",
      color: "text-purple-700",
      bgColor: "bg-purple-100",
      hoverColor: "hover:bg-purple-200",
      icon: Hourglass
    },
    "awaiting_approval": {
      label: "Awaiting Approval",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
      hoverColor: "hover:bg-orange-200",
      icon: AlertTriangle
    },
    "completed": {
      label: "Completed",
      color: "text-green-700",
      bgColor: "bg-green-100",
      hoverColor: "hover:bg-green-200",
      icon: Check
    },
    "pending": {
      label: "Pending",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
      hoverColor: "hover:bg-yellow-200",
      icon: Clock
    },
    "approved": {
      label: "Approved",
      color: "text-green-700",
      bgColor: "bg-green-100",
      hoverColor: "hover:bg-green-200",
      icon: Check
    },
    "rejected": {
      label: "Rejected",
      color: "text-red-700",
      bgColor: "bg-red-100",
      hoverColor: "hover:bg-red-200",
      icon: AlertTriangle
    }
  };

  // Normalize status by replacing spaces with underscores and converting to lowercase
  const normalizedStatus = status.toLowerCase().replace(/ /g, "_");
  
  return statusMap[normalizedStatus] || {
    label: status.replace(/_/g, " "),
    color: "text-gray-700",
    bgColor: "bg-gray-100",
    hoverColor: "hover:bg-gray-200",
    icon: Clock
  };
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${config.bgColor} ${config.hoverColor} border-transparent`}
    >
      <Icon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}