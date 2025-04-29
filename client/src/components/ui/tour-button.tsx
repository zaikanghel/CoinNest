import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useTour } from "@/hooks/use-tour";
import { useLocation } from "wouter";

export function TourButton() {
  const { startTour } = useTour();
  const [location, navigate] = useLocation();
  
  // For non-protected routes (like landing page), we don't want to show the tour button
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
        <Button variant="ghost" size="icon" className="relative" aria-label="Help and Tour">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => startTour()}
          className="cursor-pointer"
        >
          Start App Tour
        </DropdownMenuItem>
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
