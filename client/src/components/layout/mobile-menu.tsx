import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [location] = useLocation();
  const { user } = useAuth();

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

  const handleItemClick = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 h-screen max-h-screen overflow-auto" onEscapeKeyDown={onClose}>
        <div className="bg-primary-600 dark:bg-primary-900 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold">
              <i className="ri-money-dollar-circle-line mr-2"></i>
              IdleCash
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/10" 
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <div 
                  className={cn(
                    "flex items-center px-3 py-3 rounded-md transition-colors",
                    location === item.href 
                      ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400" 
                      : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                  onClick={handleItemClick}
                >
                  <i className={cn(item.icon, "text-xl mr-3")}></i>
                  <span className="font-medium">{item.label}</span>
                </div>
              </Link>
            ))}
          </nav>
          
          <div className="border-t border-gray-200 dark:border-gray-800 mt-4 pt-4">
            <Link href="/settings">
              <div 
                className="flex items-center px-3 py-3 rounded-md text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleItemClick}
              >
                <i className="ri-settings-3-line text-xl mr-3"></i>
                <span className="font-medium">Settings</span>
              </div>
            </Link>
            <Link href="/help">
              <div 
                className="flex items-center px-3 py-3 rounded-md text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={handleItemClick}
              >
                <i className="ri-question-line text-xl mr-3"></i>
                <span className="font-medium">Help</span>
              </div>
            </Link>
          </div>
          
          {/* Premium Badge */}
          <div className="mt-6 p-4 bg-gradient-to-r from-primary to-accent rounded-lg text-white shadow-lg relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/10 rounded-full"></div>
            <div className="absolute right-8 top-2 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
            
            <div className="flex items-center">
              <i className="ri-vip-crown-line text-yellow-300 text-xl"></i>
              <p className="ml-2 font-medium">Free Account</p>
            </div>
            <p className="text-xs mt-1 opacity-90">Upgrade to premium for 2x AFK earnings</p>
            <Button 
              className="mt-2 w-full py-1.5 bg-white/20 hover:bg-white/30 text-white"
              variant="ghost"
              onClick={onClose}
            >
              Boost Your Idle Income
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}