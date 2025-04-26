import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
    { href: "/", label: "Dashboard", icon: "ri-dashboard-line" },
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
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      <aside 
        className={cn(
          "fixed top-0 left-0 z-40 w-64 h-screen transition-transform bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-gray-700",
          isMobile && !isOpen && "-translate-x-full",
          !isMobile && "sm:translate-x-0"
        )}
      >
        <div className="h-full px-3 py-6 flex flex-col">
          <div className="flex items-center justify-center mb-8">
            <Link href="/">
              <a className="text-2xl font-bold text-primary-500 font-poppins">
                <i className="ri-gamepad-line mr-2"></i>EarnPlay
              </a>
            </Link>
          </div>
          
          <nav className="flex-grow">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <a 
                      className={cn(
                        "flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/50 group",
                        location === item.href && "bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-400"
                      )}
                    >
                      <i className={cn(item.icon, "text-xl mr-3")}></i>
                      <span className="font-medium">{item.label}</span>
                    </a>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="mt-auto border-t border-gray-200 dark:border-gray-700 pt-4">
            <Link href="/settings">
              <a className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/50 group">
                <i className="ri-settings-3-line text-xl mr-3"></i>
                <span className="font-medium">Settings</span>
              </a>
            </Link>
            <Link href="/help">
              <a className="flex items-center p-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/50 group">
                <i className="ri-question-line text-xl mr-3"></i>
                <span className="font-medium">Help</span>
              </a>
            </Link>
          </div>

          {/* Premium Badge/Upgrade Section */}
          <div className="mt-4 p-3 bg-gradient-to-r from-primary-600 to-violet-500 rounded-lg text-white">
            <div className="flex items-center">
              <i className="ri-vip-crown-line text-yellow-300 text-xl"></i>
              <p className="ml-2 font-medium">Free Account</p>
            </div>
            <p className="text-xs mt-1 text-white/90">Upgrade to premium for 2x earnings</p>
            <Button 
              className="mt-2 w-full py-1.5 bg-white/20 hover:bg-white/30 rounded text-sm font-medium transition"
              variant="ghost"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
