import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";
import { useMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import Head from "react-helmet";

type MainLayoutProps = {
  children: React.ReactNode;
  pageTitle: string;
};

export default function MainLayout({ children, pageTitle }: MainLayoutProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMobile();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);
  
  // Handle resize events for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // Close sidebar automatically when window is resized to desktop view
      if (window.innerWidth >= 640 && sidebarOpen && isMobile) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen, isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect due to useEffect
  }

  return (
    <>
      <Head>
        <title>{pageTitle} | IdleCash</title>
      </Head>

      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <Sidebar
          isMobile={isMobile}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 sm:ml-64">
          <Header toggleSidebar={toggleSidebar} pageTitle={pageTitle} />

          <main className="p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
