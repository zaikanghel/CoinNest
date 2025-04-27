import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/lib/utils";
import { Loader2, ChevronDown, ChevronUp, TicketIcon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type SupportTicket = {
  id: number;
  subject: string;
  message: string;
  status: string;
  adminResponse: string | null;
  createdAt: string;
  updatedAt: string;
  isPremium?: boolean;
  priority?: number;
  closedAt?: string | null;
};

export default function UserSupportTickets() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [expandedTickets, setExpandedTickets] = useState<number[]>([]);

  // Fetch user's support tickets when logged in
  const { 
    data: tickets = [], 
    isLoading, 
    isError, 
    refetch 
  } = useQuery<SupportTicket[]>({
    queryKey: ['/api/support/tickets'],
    enabled: !!user, // Only fetch if user is logged in
  });

  // Toggle expanded state for a ticket
  const toggleExpand = (ticketId: number) => {
    setExpandedTickets(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId) 
        : [...prev, ticketId]
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="secondary">Open</Badge>;
      case "in_progress":
        return <Badge variant="default">In Progress</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="secondary">Open</Badge>;
    }
  };

  // If not logged in
  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-10">
          <p className="text-muted-foreground">Please log in to view your support tickets.</p>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load your support tickets.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No tickets state
  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-8">
          <TicketIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">You don't have any support tickets yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Display tickets
  return (
    <div className="space-y-4 mt-6">
      <h3 className="text-lg font-medium">Your Support Tickets</h3>
      
      {tickets.map((ticket: SupportTicket) => (
        <Card key={ticket.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">
                  {ticket.subject}
                </CardTitle>
                <CardDescription className="mt-1">
                  Submitted on {formatDate(ticket.createdAt)}
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(ticket.status)}
                {ticket.isPremium && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
                    Priority
                  </Badge>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => toggleExpand(ticket.id)}
                  className="h-8 w-8 p-0"
                >
                  {expandedTickets.includes(ticket.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          
          {expandedTickets.includes(ticket.id) && (
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Your message:</h4>
                  <div className="bg-muted p-3 rounded-md text-sm">
                    {ticket.message}
                  </div>
                </div>
                
                {ticket.adminResponse ? (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Admin response:</h4>
                    <div className="bg-primary-50 dark:bg-primary-950/30 p-3 rounded-md text-sm border border-primary-200 dark:border-primary-800">
                      {ticket.adminResponse}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Last updated: {formatDate(ticket.updatedAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No response from admin yet. We'll get back to you soon.
                  </p>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}