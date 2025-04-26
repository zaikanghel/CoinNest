import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toaster />
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
