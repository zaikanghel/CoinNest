import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "@shared/schema";
import { getRelativeTime } from "@/lib/utils";
import { Link } from "wouter";

// Icons for different activity types
const activityIcons: Record<string, { icon: string; bg: string }> = {
  afk: { 
    icon: "ri-time-line", 
    bg: "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400" 
  },
  game: { 
    icon: "ri-gamepad-line", 
    bg: "bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400" 
  },
  referral: { 
    icon: "ri-user-add-line", 
    bg: "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400" 
  },
  withdrawal: { 
    icon: "ri-wallet-3-line", 
    bg: "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400" 
  },
  refund: { 
    icon: "ri-refund-2-line", 
    bg: "bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400" 
  }
};

// Default icon if type is not found
const defaultIcon = { 
  icon: "ri-history-line", 
  bg: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" 
};

type ActivityListProps = {
  activities: Activity[];
  limit?: number;
};

export default function ActivityList({ activities, limit = 4 }: ActivityListProps) {
  // Get the icon and background for an activity type
  const getActivityStyle = (type: string) => {
    return activityIcons[type] || defaultIcon;
  };

  // Limit the activities to show
  const displayActivities = activities.slice(0, limit);

  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-bold">Recent Activity</CardTitle>
          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full font-medium">
            Last 24 hours
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {displayActivities.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {displayActivities.map((activity) => {
              const { icon, bg } = getActivityStyle(activity.type);
              
              return (
                <div 
                  key={activity.id} 
                  className="flex items-start p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                >
                  <div className={`p-3 rounded-xl mr-4 ${bg} shadow-sm`}>
                    <i className={`${icon} text-xl`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{formatActivityType(activity.type)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-sm font-semibold ${
                            activity.amount >= 0 
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                          }`}>
                          {activity.amount >= 0 ? '+' : ''}{activity.amount}
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {getRelativeTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-500 dark:text-gray-400">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
              <i className="ri-history-line text-2xl"></i>
            </div>
            <p className="font-medium">No recent activity</p>
            <p className="text-xs mt-1">Start earning to see your activity here</p>
          </div>
        )}
        
        {activities.length > limit && (
          <div className="p-4 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900/30 text-center">
            <Link to="/activities">
              <span className="inline-flex items-center text-primary hover:underline text-sm font-medium cursor-pointer px-4 py-2 rounded-lg hover:bg-primary/5 transition-colors">
                View All Activity <i className="ri-arrow-right-line ml-1"></i>
              </span>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Format activity type for display
function formatActivityType(type: string): string {
  switch (type) {
    case 'afk':
      return 'AFK Earnings';
    case 'game':
      return 'Game Reward';
    case 'referral':
      return 'Referral Bonus';
    case 'withdrawal':
      return 'Withdrawal';
    case 'refund':
      return 'Refund';
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
