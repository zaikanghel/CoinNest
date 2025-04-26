import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

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

  // Disable body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isOpen]);

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
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 animate-fadeIn"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <aside 
        id="mobile-menu"
        className={cn(
          "fixed top-0 left-0 z-40 w-64 h-screen transition-transform duration-300 ease-in-out bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-lg",
          isMobile && !isOpen && "-translate-x-full",
          isMobile && isOpen && "translate-x-0",
          !isMobile && "translate-x-0"
        )}
      >
        <div className="h-full px-3 py-6 flex flex-col relative">
          {/* Close button for mobile */}
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          )}
          
          <div className="flex items-center justify-center mb-8">
            <Link href="/dashboard">
              <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent font-poppins cursor-pointer">
                <i className="ri-money-dollar-circle-line mr-2"></i>IdleCash
              </div>
            </Link>
          </div>
          
          <nav className="flex-grow">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <div 
                      className={cn(
                        "flex items-center p-2 rounded-lg cursor-pointer",
                        location === item.href 
                          ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400" 
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-600 dark:hover:text-primary-400"
                      )}
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
          
          <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-4">
            <Link href="/settings">
              <div className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                <i className="ri-settings-3-line text-xl mr-3"></i>
                <span className="font-medium">Settings</span>
              </div>
            </Link>
            <Link href="/help">
              <div className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
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
        </div>
      </aside>
    </>
  );
}
