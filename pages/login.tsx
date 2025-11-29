"use strict";

/**
 * File: login.tsx
 * Description: Next.js page for user authentication with automatic redirect for already logged-in users.
 * Responsibilities:
 *   - Render the login form within a centered layout
 *   - Display application branding and authentication instructions
 *   - Redirect authenticated users to home page (prevents duplicate login)
 *   - Provide glass-effect styled container for the login form
 *   - Hide navigation bar to maintain focus on authentication
 *   - Serve as the primary entry point for unauthenticated users
 * Called by:
 *   - Next.js framework (automatically loaded when user navigates to /login)
 *   - Index page (redirects root URL here)
 *   - Navigation when user is not authenticated
 *   - Logout action (redirects user here after sign out)
 *   - Protected pages (redirect unauthenticated users here)
 * Notes:
 *   - Uses redirectAuthenticatedGetServerSideProps to redirect logged-in users to /home
 *   - Layout is configured with hideNavbar prop to show minimal UI
 *   - Form submission is handled by LoginForm component via NextAuth
 *   - Text content is in Portuguese to match application language
 *   - Glass effect styling provides visual consistency
 *   - Successful login redirects to /home page
 */

import type { GetServerSideProps } from "next";
import { Layout } from "@/components/layout/Layout";
import LoginForm from "@/components/auth/LoginForm";
import { redirectAuthenticatedGetServerSideProps } from "@/lib/server-auth";

/**
 * Login page component.
 * Displays a centered authentication form with branding.
 *
 * @returns JSX element containing the login page UI
 */
function LoginPage() {
  return (
    <Layout hideNavbar>
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md mx-auto mb-6 text-center">
          <h1 className="text-3xl font-bold text-primary mb-1">
            Tay Training
          </h1>
          <p className="text-muted-foreground">Acesse sua conta</p>
        </div>
        <div className="glass-effect w-full max-w-md p-8 rounded-xl">
          <LoginForm />
        </div>
      </div>
    </Layout>
  );
}

/**
 * Server-side props handler that redirects authenticated users to home page.
 * Prevents logged-in users from accessing the login page.
 */
export const getServerSideProps: GetServerSideProps =
  redirectAuthenticatedGetServerSideProps;

export default LoginPage;