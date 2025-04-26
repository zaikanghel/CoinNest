import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidebarProps = {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
};

export default function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      onClose();
    }
  }, [location, isMobile, isOpen, onClose]);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "ri-dashboard-line" },
    { href: "/afk", label: "AFK Earning", icon: "ri-time-line" },
    { href: "/games", label: "Games", icon: "ri-gamepad-line" },
    { href: "/leaderboard", label: "Leaderboard", icon: "ri-trophy-line" },
    { href: "/wallet", label: "Wallet", icon: "ri-wallet-3-line" },
    { href: "/referrals", label: "Referrals", icon: "ri-user-add-line" },
  ];

  // Only show admin link if user is admin
  if (user?.isAdmin) {
    navItems.push({ href: "/admin", label: "Admin", icon: "ri-settings-5-line" });
  }

  return (
    <>
      <nav className="w-full">
        <ul className="space-y-2 font-medium">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <div 
                  className={cn(
                    "flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-150",
                    location === item.href 
                      ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400" 
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400"
                  )}
                  onClick={isMobile ? onClose : undefined}
                >
                  <i className={cn(item.icon, "text-xl mr-3", 
                    location === item.href ? "text-primary-600 dark:text-primary-400" : ""
                  )}></i>
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-4 mt-6">
        <Link href="/settings">
          <div 
            className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            onClick={isMobile ? onClose : undefined}
          >
            <i className="ri-settings-3-line text-xl mr-3"></i>
            <span className="font-medium">Settings</span>
          </div>
        </Link>
        <Link href="/help">
          <div 
            className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            onClick={isMobile ? onClose : undefined}
          >
            <i className="ri-question-line text-xl mr-3"></i>
            <span className="font-medium">Help</span>
          </div>
        </Link>
      </div>

      {/* Premium Badge/Upgrade Section */}
      <div className="mt-4 p-3 bg-gradient-to-r from-primary to-accent rounded-lg text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full"></div>
        <div className="absolute right-8 top-2 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
        
        <div className="flex items-center">
          <i className="ri-vip-crown-line text-yellow-300 text-xl"></i>
          <p className="ml-2 font-medium">Free Account</p>
        </div>
        <p className="text-xs mt-1 text-white/90">Upgrade to premium for 2x AFK earnings</p>
        <Button 
          className="mt-2 w-full py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition-all hover:translate-y-[-2px]"
          variant="ghost"
        >
          Boost Your Idle Income
        </Button>
      </div>
    </>
  );
}
