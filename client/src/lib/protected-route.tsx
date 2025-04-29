import { useAuth } from "@/hooks/use-auth";
import { useTour } from "@/hooks/use-tour";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { ComponentType, useEffect } from "react";

// Higher-order component that wraps each route component with onboarding check
const withOnboardingCheck = (Component: ComponentType<any>) => {
  return (props: any) => {
    const { startTour } = useTour();
    const [location] = useLocation();
    const { user } = useAuth();

    useEffect(() => {
      if (user) {
        const checkOnboardingStatus = async () => {
          try {
            console.log(`${location}: Checking onboarding status for user`, user.id);
            const response = await fetch("/api/user/onboarding-status", { credentials: "include" });
            
            if (!response.ok) {
              console.error(`${location}: Error fetching onboarding status`, response.status);
              return;
            }
            
            const data = await response.json();
            console.log(`${location}: Onboarding API response:`, data);
            
            // If this is a new user (onboarding not completed), start the tour
            if (data && data.completedOnboarding === false) {
              console.log(`${location}: Starting tour for new user`);
              setTimeout(() => {
                startTour(); // Start the tour with a slight delay to ensure UI is ready
              }, 1000);
            }
          } catch (error) {
            console.error(`${location}: Error checking onboarding status:`, error);
          }
        };
        
        checkOnboardingStatus();
      }
    }, [user, location, startTour]);

    return <Component {...props} />;
  };
};

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType;
}) {
  const { user, isLoading } = useAuth();
  
  // Wrap the component with the onboarding check
  const WrappedComponent = withOnboardingCheck(Component);

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      ) : !user ? (
        <Redirect to="/auth" />
      ) : (
        <WrappedComponent />
      )}
    </Route>
  );
}
