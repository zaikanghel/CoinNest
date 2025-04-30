import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { getUserInitials, getColorFromString } from "@/lib/utils";
import { Moon, Sun, Bell, Crown } from "lucide-react";

type HeaderProps = {
  toggleSidebar: () => void;
  pageTitle: string;
};

export default function Header({ toggleSidebar, pageTitle }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [, navigate] = useLocation();
  const [notificationCount] = useState(1); // Example notification count

  // Fetch user balance
  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await fetch("/api/user", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch user data");
      return res.json();
    },
    enabled: !!user,
  });

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate("/auth");
      },
    });
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex items-center space-x-3">
      {/* User balance */}
      <div className="hidden md:flex items-center bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 px-3 py-1.5 rounded-full">
        <i className="ri-coin-line mr-1.5"></i>
        <span className="font-medium">{userData?.balance?.toLocaleString() || user?.balance?.toLocaleString() || 0}</span>
        <span className="text-xs ml-1">coins</span>
      </div>

      {/* Notifications */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Bell className="h-5 w-5" />
        {notificationCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
        <span className="sr-only">Notifications</span>
      </Button>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-8 rounded-full focus:ring-0 focus:ring-offset-0"
          >
            <Avatar className="h-8 w-8 relative">
              <AvatarFallback className={getColorFromString(user?.username || "U")}>
                {getUserInitials(user?.username || "User")}
              </AvatarFallback>
              {user?.isPremium && (
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full w-3 h-3 border-2 border-white dark:border-gray-800" 
                  title="Premium User"
                />
              )}
            </Avatar>
            <span className="sr-only">Open user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.username}</p>
                {user?.isPremium ? (
                  <span className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center">
                    <Crown className="h-3 w-3 mr-1" />
                    Premium
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">
                    Free
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              {user?.isPremium && user.premiumUntil && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Premium until: {new Date(user.premiumUntil).toLocaleDateString()}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Link href="/profile">
                <div className="flex w-full cursor-pointer">Profile</div>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/settings">
                <div className="flex w-full cursor-pointer">Settings</div>
              </Link>
            </DropdownMenuItem>
            {user?.isAdmin && (
              <DropdownMenuItem>
                <Link href="/admin">
                  <div className="flex w-full cursor-pointer">Admin Dashboard</div>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer" onClick={handleLogout}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
