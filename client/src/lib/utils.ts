import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format seconds into a human-readable string (e.g., "1h 24m")
export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m ${seconds % 60}s`;
  }
}

// Format a date for display
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  
  // If it's today, show the time
  const today = new Date();
  if (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  ) {
    return `Today at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // If it's yesterday
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear()
  ) {
    return `Yesterday at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Otherwise show the date
  return d.toLocaleDateString([], { 
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Generate a relative time string (e.g., "2 hours ago")
export function getRelativeTime(date: Date | string | number): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else {
    return formatDate(date);
  }
}

// Generate a random math problem for captcha
export function generateMathProblem(): { 
  problem: string, 
  answer: string, 
  a: number,
  b: number
} {
  const a = Math.floor(Math.random() * 50) + 1;
  const b = Math.floor(Math.random() * 30) + 1;
  const answer = (a + b).toString();
  
  return {
    problem: `${a} + ${b} = ?`,
    answer,
    a,
    b
  };
}

// Convert coins to monetary value
export function convertCoinsToMoney(coins: number, conversionRate: number): string {
  return (coins / conversionRate).toFixed(2);
}

// Generate user initials from username
export function getUserInitials(username: string): string {
  if (!username) return '';
  return username.charAt(0).toUpperCase();
}

// Get a color based on hash of string (for consistent user colors)
export function getColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const colors = [
    'bg-primary-100 text-primary-700 dark:bg-primary-700 dark:text-primary-200',
    'bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-200',
    'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-200',
    'bg-amber-100 text-amber-700 dark:bg-amber-700 dark:text-amber-200',
    'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-200',
    'bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-200',
  ];
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
