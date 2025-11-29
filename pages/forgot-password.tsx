"use strict";

/**
 * File: forgot-password.tsx
 * Description: Next.js page for password recovery functionality with authentication redirect.
 * Responsibilities:
 *   - Render the forgot password form within a centered layout
 *   - Display application branding and recovery instructions
 *   - Redirect authenticated users to home page (prevents logged-in users from accessing)
 *   - Provide glass-effect styled container for the recovery form
 *   - Hide navigation bar to maintain focus on password recovery
 * Called by:
 *   - Next.js framework (automatically loaded when user navigates to /forgot-password)
 *   - Login page (via "Esqueci minha senha" link)
 *   - Public users attempting password recovery
 * Notes:
 *   - Uses redirectAuthenticatedGetServerSideProps to prevent access by logged-in users
 *   - Layout is configured with hideNavbar prop to show minimal UI
 *   - Form submission is handled by ForgotPassword component
 *   - Text content is in Portuguese to match application language
 *   - Glass effect styling provides visual consistency with login page
 */

import type { GetServerSideProps } from "next";
import { Layout } from "@/components/layout/Layout";
import ForgotPassword from "@/components/auth/ForgotPassword";
import { redirectAuthenticatedGetServerSideProps } from "@/lib/server-auth";

/**
 * Forgot Password page component.
 * Displays a centered password recovery form with branding.
 *
 * @returns JSX element containing the password recovery page UI
 */
function ForgotPasswordPage() {
  return (
    <Layout hideNavbar>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-accent/30">
        <div className="w-full max-w-md mx-auto mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary mb-1">
            Tay Training
          </h1>
          <p className="text-muted-foreground">Recupere sua senha</p>
        </div>
        <div className="glass-effect w-full max-w-md p-8 rounded-xl">
          <ForgotPassword />
        </div>
      </div>
    </Layout>
  );
}

/**
 * Server-side props handler that redirects authenticated users.
 * Prevents logged-in users from accessing the password recovery page.
 */
export const getServerSideProps: GetServerSideProps =
  redirectAuthenticatedGetServerSideProps;

export default ForgotPasswordPage;