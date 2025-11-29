"use strict";

/**
 * File: ForgotPassword.tsx
 * Description: Password recovery form component with email submission and success state.
 * Responsibilities:
 *   - Render password recovery form with email input
 *   - Handle form submission and validation
 *   - Display loading state during submission
 *   - Show success confirmation after submission
 *   - Provide navigation back to login page
 *   - Display toast notifications for success and error states
 *   - Call password reset API endpoint
 * Called by:
 *   - pages/forgot-password.tsx (main forgot password page)
 * Notes:
 *   - Integrates with /api/auth/forgot-password endpoint
 *   - Email validation is handled by HTML5 required and type="email" plus custom validation
 *   - Success state shows submitted email with confirmation message
 *   - All text content is in Portuguese to match application language
 *   - Component manages its own loading and submission state
 *   - API always returns success to prevent email enumeration attacks
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

/**
 * Sends password reset request to API endpoint.
 *
 * @param email - User's email address
 * @returns Promise that resolves when API call completes
 * @throws Error if API call fails
 */
async function sendPasswordResetEmail(email: string): Promise<void> {
  const response = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || "Não foi possível enviar o e-mail de redefinição"
    );
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || "Erro ao processar solicitação");
  }
}

/**
 * Validates email format.
 * Provides additional validation beyond HTML5 required attribute.
 *
 * @param email - Email string to validate
 * @returns true if email is valid, false otherwise
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") {
    return false;
  }
  
  const trimmedEmail = email.trim();
  if (trimmedEmail.length === 0) {
    return false;
  }
  
  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmedEmail);
}

/**
 * Password recovery form component.
 * Displays email input form and handles password reset flow.
 *
 * @returns JSX element containing the password recovery form or success message
 */
export function ForgotPassword() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  /**
   * Handles navigation back to login page.
   */
  function handleBackToLogin(): void {
    router.push("/login");
  }

  /**
   * Handles form submission for password reset request.
   *
   * @param e - Form submission event
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    // Validate email before submission
    if (!isValidEmail(email)) {
      toast({
        variant: "destructive",
        title: "E-mail inválido",
        description: "Por favor, digite um endereço de e-mail válido.",
      });
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(email.trim());
      
      setIsSubmitted(true);
      toast({
        title: "Solicitação enviada",
        description: "Verifique seu e-mail para redefinir sua senha.",
      });
    } catch (error) {
      console.error("Password reset error:", error);
      
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: "Não foi possível processar sua solicitação.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Handles email input change.
   *
   * @param value - New email value
   */
  function handleEmailChange(value: string): void {
    setEmail(value);
  }

  // Success state: Show confirmation message
  if (isSubmitted) {
    return (
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <Button
          variant="ghost"
          className="mb-6 pl-0 flex items-center gap-2 text-muted-foreground hover:text-foreground"
          onClick={handleBackToLogin}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para o login</span>
        </Button>

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
          <Button className="mt-4 w-full" onClick={handleBackToLogin}>
            Voltar para o login
          </Button>
        </div>
      </div>
    );
  }

  // Initial state: Show password reset form
  return (
    <div className="w-full max-w-md mx-auto animate-fade-in">
      <Button
        variant="ghost"
        className="mb-6 pl-0 flex items-center gap-2 text-muted-foreground hover:text-foreground"
        onClick={handleBackToLogin}
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar para o login</span>
      </Button>

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
            onChange={(e) => handleEmailChange(e.target.value)}
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
    </div>
  );
}

export default ForgotPassword;
