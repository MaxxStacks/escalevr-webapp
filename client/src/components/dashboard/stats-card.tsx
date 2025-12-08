type TrendDirection = 'up' | 'down' | 'none';

interface TrendInfo {
  direction: TrendDirection;
  value?: string;
  text: string;
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: "primary" | "secondary" | "red" | "green" | "blue" | "yellow";
  trend: TrendInfo;
}

export default function StatsCard({ title, value, icon, color, trend }: StatsCardProps) {
  // Map colors to proper Tailwind classes
  const colorClasses = {
    primary: {
      bg: "bg-primary-100",
      text: "text-primary-600"
    },
    secondary: {
      bg: "bg-secondary-100",
      text: "text-secondary-600"
    },
    red: {
      bg: "bg-red-100",
      text: "text-red-600"
    },
    green: {
      bg: "bg-green-100",
      text: "text-green-600"
    },
    blue: {
      bg: "bg-blue-100",
      text: "text-blue-600"
    },
    yellow: {
      bg: "bg-yellow-100",
      text: "text-yellow-600"
    }
  };

  // Get trend icon and text color
  const getTrendClasses = () => {
    switch (trend.direction) {
      case 'up':
        return {
          icon: "arrow_upward",
          color: "text-green-600"
        };
      case 'down':
        return {
          icon: "arrow_downward",
          color: "text-red-600"
        };
      default:
        return {
          icon: "remove",
          color: "text-gray-600"
        };
    }
  };

  const trendClasses = getTrendClasses();

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[color].bg}`}>
          <span className={`material-icons ${colorClasses[color].text}`}>{icon}</span>
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
      <div className={`mt-3 text-sm ${trendClasses.color} flex items-center`}>
        <span className="material-icons text-sm mr-1">{trendClasses.icon}</span>
        <span>
          {trend.value && <span>{trend.value} </span>}
          {trend.text}
        </span>
      </div>
    </div>
  );
}
