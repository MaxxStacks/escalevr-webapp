interface TechnicianCardProps {
  technician: {
    id: number;
    name: string;
    status: string;
    todayJobCount: number;
    specialization?: string;
  };
}

export default function TechnicianCard({ technician }: TechnicianCardProps) {
  // Determine status indicator color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'on break':
      case 'idle':
        return 'bg-yellow-500';
      case 'off duty':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Format job count text
  const getJobCountText = (count: number) => {
    if (count === 0) return 'No jobs today';
    return count === 1 ? '1 job today' : `${count} jobs today`;
  };

  const statusColor = getStatusColor(technician.status);
  const jobCountText = getJobCountText(technician.todayJobCount);

  return (
    <li className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
          <span className="material-icons text-sm">person</span>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{technician.name}</p>
          <p className="text-xs text-gray-500">{technician.specialization || 'Technician'}</p>
        </div>
      </div>
      <div className="flex items-center">
        <span className={`inline-block w-2 h-2 rounded-full ${statusColor} mr-2`}></span>
        <span className="text-xs font-medium text-gray-700">
          {technician.status.charAt(0).toUpperCase() + technician.status.slice(1)}
        </span>
        <div className="ml-3 text-xs text-gray-500">{jobCountText}</div>
      </div>
    </li>
  );
}
