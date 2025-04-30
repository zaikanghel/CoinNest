import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

export function HelpButton() {
  const [location, navigate] = useLocation();
  
  // For non-protected routes (like landing page), we don't want to show the help button
  const protectedRoutes = [
    "/dashboard",
    "/games",
    "/afk",
    "/wallet",
    "/daily-rewards",
    "/referrals",
    "/leaderboard",
    "/profile",
    "/settings",
    "/premium",
    "/help"
  ];
  
  if (!protectedRoutes.includes(location)) {
    return null;
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Help">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => navigate("/help")}
          className="cursor-pointer"
        >
          Help Center
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
