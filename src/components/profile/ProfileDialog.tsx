"use strict";

/**
 * File: ProfileDialog.tsx
 * Description: User profile management dialog component.
 * Allows authenticated users to view and edit their profile information (name).
 * Responsibilities:
 *   - Fetch user profile data from API on dialog open
 *   - Display email (read-only) and name (editable)
 *   - Validate form inputs before submission
 *   - Submit profile updates to backend API
 *   - Show toast notifications for success/error states
 *   - Handle loading states during fetch and save operations
 * Called by:
 *   - Navbar.tsx (user dropdown menu)
 * Notes:
 *   - Email field is read-only and cannot be changed
 *   - Only name field can be updated
 *   - Profile is fetched each time dialog opens
 *   - Form validation requires non-empty name
 *   - Uses shadcn/ui Dialog component
 */

import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

/**
 * User profile data structure.
 */
interface UserProfile {
  /** User's email address (read-only) */
  email: string;
  /** User's display name (editable) */
  name: string;
}

/**
 * Form validation errors mapped to profile fields.
 */
type FormErrors = Partial<Record<keyof UserProfile, string>>;

/**
 * API response structure for profile endpoint.
 */
interface ProfileApiResponse {
  user?: {
    email?: string;
    name?: string;
  };
  message?: string;
}

/** Default empty profile state */
const EMPTY_PROFILE: UserProfile = {
  email: "",
  name: "",
};

/** HTTP status codes */
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
} as const;

/**
 * Validates if a string is non-empty after trimming.
 * @param value - String to validate
 * @returns True if string is valid and non-empty
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Safely extracts user profile data from API response.
 * @param data - API response data
 * @returns UserProfile object with safe defaults
 */
function extractUserProfile(data: unknown): UserProfile {
  if (!data || typeof data !== "object") {
    return { ...EMPTY_PROFILE };
  }

  const response = data as ProfileApiResponse;
  const user = response.user;

  if (!user || typeof user !== "object") {
    return { ...EMPTY_PROFILE };
  }

  return {
    email: isValidString(user.email) ? user.email : "",
    name: isValidString(user.name) ? user.name : "",
  };
}

/**
 * Extracts error message from unknown error object.
 * @param error - Error object (any type)
 * @returns Error message string
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Erro desconhecido";
}

/**
 * Validates profile form data.
 * @param profile - User profile to validate
 * @returns Validation errors object (empty if valid)
 */
function validateProfile(profile: UserProfile): FormErrors {
  const errors: FormErrors = {};

  if (!isValidString(profile.name)) {
    errors.name = "Nome é obrigatório";
  }

  return errors;
}

/**
 * User profile management dialog component.
 * Allows users to view and edit their profile information.
 */
export default function ProfileDialog(): JSX.Element {
  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [form, setForm] = useState<UserProfile>({ ...EMPTY_PROFILE });
  const [errors, setErrors] = useState<FormErrors>({});
  const { toast } = useToast();

  /**
   * Fetches user profile data from API.
   * Updates form state with retrieved data or shows error toast.
   */
  async function fetchProfile(): Promise<void> {
    try {
      const response = await fetch("/api/user/profile");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: unknown = await response.json();
      const profile = extractUserProfile(data);

      // Only update if we got valid data
      if (isValidString(profile.email) || isValidString(profile.name)) {
        setForm(profile);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do perfil.",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Failed to fetch profile:", errorMessage);
      toast({
        title: "Erro",
        description: "Falha ao carregar perfil.",
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * Loads profile data when dialog opens.
   * Only fetches if dialog is open.
   */
  useEffect(
    function loadProfileOnOpen(): void {
      if (!open) {
        return;
      }

      setLoading(true);
      fetchProfile().catch((error) => {
        console.error("Error in profile fetch:", error);
        setLoading(false);
      });
    },
    [open]
  );

  /**
   * Validates the form and updates error state.
   * @returns True if form is valid, false otherwise
   */
  function validateForm(): boolean {
    const validationErrors = validateProfile(form);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }

  /**
   * Handles form submission to update user profile.
   * Validates input, sends PUT request, and shows result toast.
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const updatePayload: Partial<UserProfile> = {
        name: form.name.trim(),
      };

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      const responseData: unknown = await response.json();

      if (!response.ok) {
        const errorMsg =
          typeof responseData === "object" &&
          responseData !== null &&
          "message" in responseData &&
          typeof (responseData as { message: unknown }).message === "string"
            ? (responseData as { message: string }).message
            : "Erro ao atualizar";

        throw new Error(errorMsg);
      }

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas.",
      });

      setOpen(false);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Failed to update profile:", errorMessage);
      toast({
        title: "Erro",
        description: errorMessage || "Erro ao salvar.",
      });
    } finally {
      setLoading(false);
    }
  }

  /**
   * Handles closing the dialog.
   * Resets form to prevent stale data.
   */
  function handleOpenChange(isOpen: boolean): void {
    setOpen(isOpen);

    // Reset errors when closing
    if (!isOpen) {
      setErrors({});
    }
  }

  /**
   * Handles name input change.
   * Updates form state and clears related errors.
   */
  function handleNameChange(value: string): void {
    setForm((prev) => ({ ...prev, name: value }));

    // Clear name error when user starts typing
    if (errors.name) {
      setErrors((prev) => {
        const { name, ...rest } = prev;
        return rest;
      });
    }
  }

  /**
   * Handles cancel button click.
   * Closes dialog without saving.
   */
  function handleCancel(): void {
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full text-left">
          Perfil
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Perfil</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email - Read Only */}
          <div>
            <Label className="text-sm" htmlFor="profile-email">
              Email
            </Label>
            <Input
              id="profile-email"
              value={form.email}
              disabled
              className="bg-muted cursor-not-allowed"
              aria-readonly="true"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Não é possível alterar o email
            </p>
          </div>

          {/* Name */}
          <div>
            <Label className="text-sm" htmlFor="profile-name">
              Nome
            </Label>
            <Input
              id="profile-name"
              value={form.name}
              onChange={(e): void => handleNameChange(e.target.value)}
              disabled={loading}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p
                id="name-error"
                className="text-xs text-destructive"
                role="alert"
              >
                {errors.name}
              </p>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleCancel}
                type="button"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
