import { Switch, Route, Redirect } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";

// For now, skip all the complex layouts and just render the auth page
// for debugging authentication functionality
function App() {
  return (
    <TooltipProvider>
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/">
          <Redirect to="/auth" />
        </Route>
        <Route path="/:rest*">
          <Redirect to="/auth" />
        </Route>
      </Switch>
    </TooltipProvider>
  );
}

export default App;
