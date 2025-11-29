"use strict";

/**
 * File: 404.tsx
 * Description: Custom Next.js 404 error page displayed when users navigate to non-existent routes.
 * Responsibilities:
 *   - Display user-friendly 404 error message in Portuguese
 *   - Provide navigation options to return to previous page or login
 *   - Maintain consistent styling with application theme
 *   - Handle navigation actions safely
 * Called by:
 *   - Next.js framework (automatically rendered for unmatched routes)
 *   - Triggered when user visits any URL that doesn't match defined routes
 * Notes:
 *   - This is a Next.js special file that must be named 404.tsx
 *   - Text is in Portuguese to match application language
 *   - Provides two navigation options: back button and login redirect
 *   - Uses Next.js router for client-side navigation
 */

import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";

/**
 * Handles navigation back to the previous page.
 * Uses Next.js router history to return to last visited page.
 *
 * @param router - Next.js router instance
 */
function handleGoBack(router: ReturnType<typeof useRouter>): void {
  router.back();
}

/**
 * Handles navigation to the login page.
 * Redirects user to /login route.
 *
 * @param router - Next.js router instance
 */
function handleGoToLogin(router: ReturnType<typeof useRouter>): void {
  router.push("/login");
}

/**
 * Custom 404 error page component.
 * Displays when user attempts to access a non-existent route.
 *
 * @returns JSX element containing the 404 error page UI
 */
export default function Custom404() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-lg text-muted-foreground">
          Página não encontrada
        </p>
        <p className="text-sm text-muted-foreground">
          A página que você está procurando não existe.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button variant="outline" onClick={() => handleGoBack(router)}>
            Voltar
          </Button>
          <Button onClick={() => handleGoToLogin(router)}>
            Ir para Login
          </Button>
        </div>
      </div>
    </div>
  );
}

