"use strict";

/**
 * File: LoginForm.tsx
 * Description: User authentication form component with validation and NextAuth integration.
 * Responsibilities:
 *   - Render login form with email and password inputs
 *   - Validate form inputs (email format, password length)
 *   - Handle form submission and authentication via NextAuth
 *   - Display loading states during authentication
 *   - Show/hide password toggle functionality
 *   - Display validation errors and toast notifications
 *   - Navigate to home page on successful login
 *   - Provide link to forgot password page
 * Called by:
 *   - pages/login.tsx (main login page)
 * Notes:
 *   - Uses NextAuth signIn with 'credentials' provider
 *   - All text content is in Portuguese to match application language
 *   - Password visibility toggle for better UX
 *   - Client-side validation before API call
 *   - Redirects to /home on successful authentication
 *   - Error messages are translated using getAuthErrorMessage helper
 */

import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import type { SignInResponse } from "next-auth/react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuthErrorMessage } from "@/lib/error-messages";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * Form data structure for login credentials.
 */
interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Form validation errors structure.
 */
interface FormErrors {
  email?: string;
  password?: string;
}

/**
 * Email validation regex pattern.
 * Matches standard email format: user@domain.extension
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Minimum password length requirement.
 */
const MIN_PASSWORD_LENGTH = 6;

/**
 * Redirect delay after successful login (milliseconds).
 */
const REDIRECT_DELAY_MS = 700;

/**
 * Validates email format.
 *
 * @param email - Email string to validate
 * @returns Error message if invalid, undefined if valid
 */
function validateEmail(email: string): string | undefined {
  if (!email || email.trim().length === 0) {
    return "Email é obrigatório";
  }

  if (!EMAIL_REGEX.test(email)) {
    return "Email inválido";
  }

  return undefined;
}

/**
 * Validates password requirements.
 *
 * @param password - Password string to validate
 * @returns Error message if invalid, undefined if valid
 */
function validatePassword(password: string): string | undefined {
  if (!password || password.length === 0) {
    return "Senha é obrigatória";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres`;
  }

  return undefined;
}

/**
 * Validates a single form field.
 *
 * @param name - Field name to validate
 * @param value - Field value to validate
 * @returns Error message if invalid, undefined if valid
 */
function validateField(name: keyof LoginFormData, value: string): string | undefined {
  if (name === "email") {
    return validateEmail(value);
  }

  if (name === "password") {
    return validatePassword(value);
  }

  return undefined;
}

/**
 * Validates entire form data.
 *
 * @param formData - Form data to validate
 * @returns Object with validation errors, empty if all valid
 */
function validateForm(formData: LoginFormData): FormErrors {
  const errors: FormErrors = {};

  const emailError = validateEmail(formData.email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(formData.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return errors;
}

/**
 * Checks if form has any validation errors.
 *
 * @param errors - Form errors object
 * @returns true if there are errors, false otherwise
 */
function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Login form component.
 * Handles user authentication with email and password.
 *
 * @returns JSX element containing the login form
 */
export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  /**
   * Handles input field changes and validates the field.
   *
   * @param e - Change event from input element
   */
  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;

    // Update form data
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validate field and update errors
    const fieldName = name as keyof LoginFormData;
    const error = validateField(fieldName, value);

    setErrors((prev) => {
      const next = { ...prev };

      if (error) {
        next[fieldName] = error;
      } else {
        delete next[fieldName];
      }

      return next;
    });
  }

  /**
   * Toggles password visibility.
   */
  function handleTogglePassword(): void {
    setShowPassword((prev) => !prev);
  }

  /**
   * Navigates to forgot password page.
   */
  function handleForgotPassword(): void {
    router.push("/forgot-password");
  }

  /**
   * Handles form submission and authentication.
   *
   * @param e - Form submission event
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    // Validate all fields
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);

    if (hasErrors(validationErrors)) {
      toast({
        variant: "destructive",
        title: "Corrija os erros do formulário",
        description: "Verifique os campos destacados em vermelho.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result: SignInResponse | undefined = await signIn("credentials", {
        redirect: false,
        email: formData.email.trim(),
        password: formData.password,
      });

      if (result?.ok) {
        toast({
          title: "Login bem-sucedido!",
          description: "Redirecionando...",
        });

        // Delay redirect to show success message
        setTimeout(() => {
          router.push("/home");
        }, REDIRECT_DELAY_MS);
      } else {
        const errorMessage = getAuthErrorMessage(result?.error);

        toast({
          variant: "destructive",
          title: "Falha no login",
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error("Login error:", error);

      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao tentar autenticar. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full animate-fade-in">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Digite seu email"
              value={formData.email}
              onChange={handleChange}
              required
              className="h-12"
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p
                id="email-error"
                className="text-sm text-destructive mt-1"
                role="alert"
              >
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha</Label>
              <Button
                variant="link"
                className="px-0 font-normal text-xs text-primary"
                type="button"
                onClick={handleForgotPassword}
              >
                Esqueceu a senha?
              </Button>
            </div>

            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={handleChange}
                required
                className="h-12 pr-10"
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={handleTogglePassword}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p
                id="password-error"
                className="text-sm text-destructive mt-1"
                role="alert"
              >
                {errors.password}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className={cn(
            "w-full h-12 text-base font-medium transition-all duration-300",
            isLoading ? "bg-primary/80" : "bg-primary hover:bg-primary/90"
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white border-opacity-50 border-t-white rounded-full" />
              Entrando...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Entrar
            </div>
          )}
        </Button>
      </form>
    </div>
  );
}

export default LoginForm;
