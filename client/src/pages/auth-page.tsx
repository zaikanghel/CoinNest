import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { loginSchema, registerSchema } from "@shared/schema";

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  
  // Get authentication context
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  
  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      referredBy: "",
    },
  });

  // Handle login submit
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    setLoginError(null);
    loginMutation.mutate(values, {
      onError: (error) => {
        setLoginError(error.message);
      },
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  // Handle register submit
  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    setRegisterError(null);
    registerMutation.mutate(values, {
      onError: (error) => {
        setRegisterError(error.message);
      },
      onSuccess: () => {
        navigate("/");
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-violet-600 text-white p-8 md:w-1/2 flex flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 font-poppins">
            EarnPlay
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">
            Play games, stay active, earn rewards
          </h2>
          <p className="text-lg mb-8 text-white/80">
            Join our platform to earn coins through AFK activities and mini-games. Convert your earnings to real money or use them to unlock exclusive content.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded mr-3">
                <span className="text-lg">⏱️</span>
              </div>
              <div>
                <h3 className="font-medium">AFK Earnings</h3>
                <p className="text-sm text-white/70">Earn while keeping the tab open</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded mr-3">
                <span className="text-lg">🎮</span>
              </div>
              <div>
                <h3 className="font-medium">Fun Mini-Games</h3>
                <p className="text-sm text-white/70">Play games to boost your earnings</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="bg-white/20 p-2 rounded mr-3">
                <span className="text-lg">👥</span>
              </div>
              <div>
                <h3 className="font-medium">Referral System</h3>
                <p className="text-sm text-white/70">Invite friends and earn commission</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Forms */}
      <div className="p-8 md:w-1/2 flex items-center justify-center bg-gray-50 dark:bg-dark-800">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              {activeTab === "login" ? "Welcome Back" : "Create an Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {activeTab === "login"
                ? "Enter your credentials to access your account"
                : "Fill out the form below to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {loginError && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {loginError}
                        </AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="referredBy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Referral Code (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter referral code if you have one" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {registerError && (
                      <Alert variant="destructive">
                        <AlertDescription>
                          {registerError}
                        </AlertDescription>
                      </Alert>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
