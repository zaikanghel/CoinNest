import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Search, HelpCircle, MessageSquareText, LifeBuoy, FileText, Info, Loader2 } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import UserSupportTickets from "@/components/support-tickets";

// FAQs data
const faqsData = [
  {
    id: 'general',
    title: 'General',
    questions: [
      { 
        question: "What is CoinNest?", 
        answer: "CoinNest is a platform that allows you to earn virtual currency through idle time and playing games. You can convert your earnings to real money once you reach the minimum withdrawal threshold." 
      },
      { 
        question: "How do I start earning?", 
        answer: "You can start earning in two ways: by keeping the AFK page open to earn passively, or by playing games to earn actively. Navigate to the respective sections from the sidebar menu." 
      },
      { 
        question: "Is CoinNest free to use?", 
        answer: "Yes, CoinNest is completely free to use. However, premium members get additional benefits like higher earning rates." 
      },
      { 
        question: "How much can I earn per day?", 
        answer: "Your earnings depend on how long you keep the app running in AFK mode and how well you perform in games. There is a daily limit to AFK earnings, which you can view on the AFK page." 
      }
    ]
  },
  {
    id: 'afk',
    title: 'AFK Earning',
    questions: [
      { 
        question: "How does AFK earning work?", 
        answer: "AFK earnings are generated when you keep the AFK page open and active in your browser. The system automatically accumulates coins based on your time spent on the page." 
      },
      { 
        question: "Is there a maximum daily limit?", 
        answer: "Yes, there is a daily limit to prevent abuse. You can view your daily limit and remaining earning potential on the AFK page." 
      },
      { 
        question: "What if my computer goes to sleep?", 
        answer: "If your computer goes to sleep or the tab is no longer active, you will stop earning. Make sure to keep the tab active and your computer awake." 
      },
      { 
        question: "What are captchas for?", 
        answer: "Occasionally, you'll need to solve a captcha to verify you're actively present. This prevents automated farming and ensures fair play for all users." 
      }
    ]
  },
  {
    id: 'games',
    title: 'Games',
    questions: [
      { 
        question: "What games can I play to earn?", 
        answer: "We offer various mini-games like Memory Match, Clicker Quest, and more. Each game has different earning rates based on your performance." 
      },
      { 
        question: "How are game earnings calculated?", 
        answer: "Each game has its own scoring system. Generally, higher scores and better performance result in more coins earned. The specific rates are displayed on each game's page." 
      },
      { 
        question: "Is there a limit to game earnings?", 
        answer: "Unlike AFK, game earnings typically don't have a daily limit. However, anti-cheat measures are in place to detect unusual patterns." 
      },
      { 
        question: "Can I play games on mobile?", 
        answer: "Yes, most of our games are optimized for mobile play. You can access them from your mobile browser without downloading any apps." 
      }
    ]
  },
  {
    id: 'wallet',
    title: 'Wallet & Withdrawals',
    questions: [
      { 
        question: "How do I withdraw my earnings?", 
        answer: "Once you reach the minimum withdrawal threshold (typically 100 coins), you can request a withdrawal from the Wallet page. Choose your preferred payment method and follow the instructions." 
      },
      { 
        question: "What withdrawal methods are available?", 
        answer: "We currently support PayPal and GCASH for withdrawals. More payment methods may be added in the future." 
      },
      { 
        question: "How long do withdrawals take?", 
        answer: "Withdrawals are typically processed within 1-3 business days. You'll receive a notification once your withdrawal has been processed." 
      },
      { 
        question: "What is the conversion rate?", 
        answer: "The conversion rate from coins to real money is displayed on the Wallet page. Rates may vary slightly based on payment method and processing fees." 
      }
    ]
  },
  {
    id: 'account',
    title: 'Account',
    questions: [
      { 
        question: "How do I update my profile?", 
        answer: "You can update your profile information by navigating to the Profile page. Click on 'Edit Profile' to make changes." 
      },
      { 
        question: "How do I change my password?", 
        answer: "You can change your password from the Profile page under the security settings section." 
      },
      { 
        question: "Can I have multiple accounts?", 
        answer: "No, our terms of service prohibit having multiple accounts. Accounts found to be duplicates may be suspended." 
      },
      { 
        question: "What happens if I forget my password?", 
        answer: "You can reset your password by clicking on the 'Forgot Password' link on the login page. A password reset link will be sent to your registered email." 
      }
    ]
  }
];

// Contact form schema
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  subject: z.string().min(5, { message: "Subject must be at least 5 characters" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function HelpPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{section: string, question: string, answer: string}>>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  // Search functionality
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      const results = faqsData.flatMap(section => 
        section.questions
          .filter(q => 
            q.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
            q.answer.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map(q => ({
            section: section.title,
            question: q.question,
            answer: q.answer
          }))
      );
      
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  // Support ticket mutation
  const submitTicketMutation = useMutation({
    mutationFn: (data: ContactFormValues) => {
      return apiRequest(
        'POST',
        '/api/support/tickets',
        data
      );
    },
    onSuccess: () => {
      toast({
        title: "Support ticket submitted",
        description: "We'll get back to you as soon as possible!",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit ticket",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    }
  });

  // Handle contact form submission
  function onSubmit(values: ContactFormValues) {
    submitTicketMutation.mutate(values);
  }

  return (
    <MainLayout pageTitle="Help & Support">
      <div className="container max-w-6xl mx-auto space-y-6">
        {/* Help Hero Section */}
        <Card className="border-none bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-950/50 dark:to-accent-950/50">
          <CardContent className="p-6 sm:p-10">
            <div className="max-w-3xl mx-auto text-center space-y-4">
              <HelpCircle className="mx-auto h-12 w-12 text-primary" />
              <h2 className="text-3xl font-bold">How Can We Help You?</h2>
              <p className="text-lg text-muted-foreground">
                Find answers to common questions or contact our support team
              </p>
              
              {/* Search Bar */}
              <div className="flex w-full max-w-lg mx-auto mt-6 relative">
                <Input
                  type="text"
                  placeholder="Search for help with..."
                  className="pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0 top-0 h-full"
                  onClick={handleSearch}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {searchResults.map((result, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1">Section: {result.section}</div>
                  <h3 className="text-lg font-semibold mb-2">{result.question}</h3>
                  <p className="text-muted-foreground">{result.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Help Content */}
        <Tabs defaultValue="faqs" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="faqs" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              FAQs
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center">
              <MessageSquareText className="h-4 w-4 mr-2" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="guides" className="flex items-center">
              <Info className="h-4 w-4 mr-2" />
              Guides
            </TabsTrigger>
          </TabsList>
          
          {/* FAQs Tab */}
          <TabsContent value="faqs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>
                  Find answers to the most common questions about CoinNest
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {faqsData.map((section) => (
                    <div key={section.id} className="space-y-2">
                      <h3 className="text-lg font-semibold">{section.title}</h3>
                      {section.questions.map((faq, idx) => (
                        <AccordionItem key={`${section.id}-${idx}`} value={`${section.id}-${idx}`}>
                          <AccordionTrigger className="text-left font-medium hover:no-underline">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </div>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Contact Tab */}
          <TabsContent value="contact" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>
                  Reach out to our team for personalized assistance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Get In Touch</h3>
                    <p className="text-muted-foreground mb-4">
                      Having trouble or need help with something not covered in our FAQs? 
                      Fill out the form and our support team will get back to you as soon as possible.
                    </p>
                    
                    <div className="space-y-4 mt-6">
                      <div className="flex items-start">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary rounded-full mr-3">
                          <MessageSquareText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">Email Support</h4>
                          <p className="text-sm text-muted-foreground">support@coinnest.com</p>
                          <p className="text-xs text-muted-foreground mt-1">Response within 24-48 hours</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <div className="p-2 bg-primary-50 dark:bg-primary-900/30 text-primary rounded-full mr-3">
                          <LifeBuoy className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-medium">Live Chat</h4>
                          <p className="text-sm text-muted-foreground">Available 9am - 5pm EST, Monday to Friday</p>
                          <p className="text-xs text-muted-foreground mt-1">Click the chat icon in the bottom right</p>
                        </div>
                      </div>
                    </div>

                    {/* User's support tickets section */}
                    <UserSupportTickets />
                  </div>
                  
                  <div>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Your name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="your@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="subject"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subject</FormLabel>
                              <FormControl>
                                <Input placeholder="What's this about?" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="message"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Message</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Tell us how we can help..." 
                                  className="min-h-[120px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Please provide as much detail as possible
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={submitTicketMutation.isPending}
                        >
                          {submitTicketMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Send Message
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Guides Tab */}
          <TabsContent value="guides" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started Guides</CardTitle>
                <CardDescription>
                  Learn how to maximize your earnings with CoinNest
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">AFK Earning Guide</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow text-sm text-muted-foreground">
                      <p>Learn how to optimize your AFK earnings, including best practices, anti-AFK detection tips, and maximizing your daily limits.</p>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                      <Button variant="outline" className="w-full">Read Guide</Button>
                    </div>
                  </Card>
                  
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Game Strategies</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow text-sm text-muted-foreground">
                      <p>Tips and tricks for each of our games to help you earn more coins through improved gameplay and strategy.</p>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                      <Button variant="outline" className="w-full">Read Guide</Button>
                    </div>
                  </Card>
                  
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Withdrawal Tutorial</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow text-sm text-muted-foreground">
                      <p>Step-by-step instructions for withdrawing your earnings, including setting up payment methods and understanding fees.</p>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                      <Button variant="outline" className="w-full">Read Guide</Button>
                    </div>
                  </Card>
                  
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Referral Program</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow text-sm text-muted-foreground">
                      <p>How to earn extra coins by referring friends and family to IdleCash, including promotion strategies.</p>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                      <Button variant="outline" className="w-full">Read Guide</Button>
                    </div>
                  </Card>
                  
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Premium Benefits</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow text-sm text-muted-foreground">
                      <p>A complete breakdown of premium subscription benefits and whether they're worth it for your earning style.</p>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                      <Button variant="outline" className="w-full">Read Guide</Button>
                    </div>
                  </Card>
                  
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Account Security</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-grow text-sm text-muted-foreground">
                      <p>Best practices for securing your account and keeping your earnings safe from unauthorized access.</p>
                    </CardContent>
                    <div className="p-4 pt-0 mt-auto">
                      <Button variant="outline" className="w-full">Read Guide</Button>
                    </div>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}