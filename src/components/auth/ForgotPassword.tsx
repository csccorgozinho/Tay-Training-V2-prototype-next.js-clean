import { useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export const ForgotPassword = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitted(true);
      toast({
        title: "Solicitação enviada",
        description: "Verifique seu e-mail para redefinir sua senha.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: "Não foi possível processar sua solicitação.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <Button
        variant="ghost"
        className="mb-6 pl-0 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/login")}
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar para o login</span>
      </Button>
      
      {isSubmitted ? (
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto">
            <Send className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold">E-mail enviado</h2>
          <p className="text-muted-foreground">
            Enviamos as instruções de redefinição para:
            <br />
            <span className="font-medium text-foreground">{email}</span>
          </p>
            <Button 
            className="mt-4 w-full"
            onClick={() => router.push("/login")}
          >
            Voltar para o login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold">Esqueceu sua senha?</h2>
            <p className="text-muted-foreground">
              Digite seu e-mail para receber um link de redefinição.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="digite@seuemail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full" />
                Enviando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Enviar instruções
              </div>
            )}
          </Button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
