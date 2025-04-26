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
    <Card>
      <CardHeader className="border-b border-gray-200 dark:border-gray-700">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      
      <CardContent className="p-2">
        {displayActivities.length > 0 ? (
          displayActivities.map((activity) => {
            const { icon, bg } = getActivityStyle(activity.type);
            
            return (
              <div 
                key={activity.id} 
                className="flex items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg"
              >
                <div className={`p-2 rounded-lg mr-3 ${bg}`}>
                  <i className={`${icon} text-lg`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{formatActivityType(activity.type)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{activity.description}</p>
                    </div>
                    <div className="text-right">
                      <span className={activity.amount >= 0 ? 'text-success-500 font-medium text-sm' : 'text-red-500 font-medium text-sm'}>
                        {activity.amount >= 0 ? '+' : ''}{activity.amount}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            No recent activity
          </div>
        )}
      </CardContent>
      
      {activities.length > limit && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
          <Link href="/activities">
            <a className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">
              View All Activity
            </a>
          </Link>
        </div>
      )}
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
