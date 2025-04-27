import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Sidebar from "./sidebar";
import Header from "./header";
import MobileMenu from "./mobile-menu";
import { useMobile } from "@/hooks/use-mobile";
import { Loader2, Menu } from "lucide-react";
import Head from "react-helmet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  
  // Disable body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    
    return () => {
      document.body.style.overflow = "";
    };
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
        <title>{pageTitle} | CoinNest</title>
      </Head>

      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {/* Mobile Navigation Menu */}
        {isMobile && (
          <MobileMenu isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        
        {/* Desktop Sidebar (hidden on mobile) */}
        {!isMobile && (
          <div className="fixed top-0 left-0 z-40 h-screen w-64 bg-white dark:bg-gray-900 shadow-lg border-r border-gray-200 dark:border-gray-800">
            <div className="h-full px-3 py-4 overflow-y-auto">
              {/* Logo */}
              <div className="flex items-center justify-center py-4 mb-4">
                <div onClick={() => navigate("/dashboard")} className="cursor-pointer">
                  <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent font-poppins">
                    <i className="ri-money-dollar-circle-line mr-2"></i>CoinNest
                  </div>
                </div>
              </div>
              
              {/* Navigation */}
              <Sidebar isMobile={isMobile} isOpen={true} onClose={() => {}} />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 sm:ml-64">
          {/* Header with mobile menu button */}
          <header className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={toggleSidebar}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle sidebar</span>
                </Button>
                
                {/* Page title */}
                <h2 className="text-xl font-poppins font-semibold text-gray-900 dark:text-gray-100 ml-2 sm:ml-0">{pageTitle}</h2>
              </div>
              
              {/* Right side header elements */}
              <Header toggleSidebar={toggleSidebar} pageTitle={pageTitle} />
            </div>
          </header>

          <main className="p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
