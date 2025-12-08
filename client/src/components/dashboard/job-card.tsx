import StatusBadge from "@/components/common/status-badge";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Eye, UserPlus, Edit } from "lucide-react";

interface JobCardProps {
  job: {
    id: number;
    jobNumber: string;
    description: string;
    status: string;
    type: string;
    clientId: number;
    technicianId?: number;
    unitId: number;
    dateCreated: string;
    dateScheduled?: string;
    dateStarted?: string;
  };
}

export default function JobCard({ job }: JobCardProps) {
  const { user } = useAuth();
  
  // Format the date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    
    const date = new Date(dateString);
    const today = new Date();
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Check if it's yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise return the full date
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  return (
    <li className="hover:bg-gray-50">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-primary-600">{job.jobNumber}</p>
          <StatusBadge status={job.status} />
        </div>
        <div className="flex items-center mt-2">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center">
              <span className="material-icons text-gray-500">directions_car</span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {/* This would be replaced with actual unit details from an API call or prop */}
              {job.type.charAt(0).toUpperCase() + job.type.slice(1)} Service
            </p>
            <p className="text-xs text-gray-500">
              {/* This would be replaced with actual VIN from an API call or prop */}
              Unit ID: #{job.unitId}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-sm text-gray-600">{job.description}</p>
          <div className="mt-1 flex items-center text-xs text-gray-500">
            <span className="material-icons text-xs mr-1">person</span>
            <p>Client: #{job.clientId}</p>
            <span className="mx-2">•</span>
            <span className="material-icons text-xs mr-1">build</span>
            <p>Tech: {job.technicianId ? `#${job.technicianId}` : "Unassigned"}</p>
          </div>
        </div>
        <div className="mt-3 flex justify-between">
          <div className="text-xs text-gray-500 flex items-center">
            <span className="material-icons text-xs mr-1">schedule</span>
            <p>
              {job.status === 'scheduled' ? `Scheduled: ${formatDate(job.dateScheduled)}` : 
               job.status === 'in_progress' ? `Started: ${formatDate(job.dateStarted)}` :
               `Created: ${formatDate(job.dateCreated)}`}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-blue-500" title="View details">
              <Eye className="h-4 w-4" />
            </Button>
            
            {/* Only show certain buttons based on user role */}
            {['admin', 'service'].includes(user?.role || '') && (
              <>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-green-500" title="Assign technician">
                  <UserPlus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary-500" title="Edit job">
                  <Edit className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
