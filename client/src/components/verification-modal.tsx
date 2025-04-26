import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateMathProblem } from "@/lib/utils";
import { Loader2, User } from "lucide-react";

type VerificationModalProps = {
  open: boolean;
  onVerify: (answer: string, expected: string) => void;
  isVerifying: boolean;
};

export default function VerificationModal({ open, onVerify, isVerifying }: VerificationModalProps) {
  const [answer, setAnswer] = useState("");
  const [problem, setProblem] = useState({ problem: "", answer: "", a: 0, b: 0 });
  const [error, setError] = useState("");

  // Generate a new problem when the modal opens
  useEffect(() => {
    if (open) {
      setProblem(generateMathProblem());
      setAnswer("");
      setError("");
    }
  }, [open]);

  // Handle submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!answer) {
      setError("Please enter an answer");
      return;
    }
    
    onVerify(answer, problem.answer);
  };

  // Generate a new problem if user wants to try a different one
  const generateNewProblem = () => {
    setProblem(generateMathProblem());
    setAnswer("");
    setError("");
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Verify You're Active</DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-4">
          <div className="mb-4">
            <User className="h-12 w-12 mx-auto text-primary-500" />
          </div>
          
          <p className="mb-4">To continue earning in AFK mode, please verify you're still active.</p>
          
          <form onSubmit={handleSubmit}>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-4 flex justify-between items-center">
              <span className="font-medium">{problem.a}</span>
              <span>+</span>
              <span className="font-medium">{problem.b}</span>
              <span>=</span>
              <Input 
                type="text" 
                className="w-16 h-10 text-center" 
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  setError("");
                }}
                placeholder="?"
                autoFocus
              />
            </div>
            
            {error && (
              <p className="text-red-500 text-sm mb-2">{error}</p>
            )}
            
            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Now"
                )}
              </Button>
              
              <Button type="button" variant="outline" className="w-full" onClick={generateNewProblem}>
                Try Different Problem
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
