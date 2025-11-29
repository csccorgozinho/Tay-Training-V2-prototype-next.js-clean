"use strict";

/**
 * File: index.tsx
 * Description: Root route page that redirects all traffic to the login page.
 * Responsibilities:
 *   - Handle requests to the root URL (/)
 *   - Redirect all visitors to /login via server-side redirect
 *   - Serve as the application entry point for new visitors
 *   - Ensure no content is rendered (redirect happens server-side)
 * Called by:
 *   - Next.js framework (automatically loaded when user navigates to /)
 *   - Browser requests to the root domain
 *   - Direct URL access to the application
 * Notes:
 *   - This is a Next.js special file that must be named index.tsx
 *   - The redirect is permanent: false (307 temporary redirect)
 *   - This allows flexibility to change the landing page in the future
 *   - Server-side redirect happens before any rendering
 *   - Component returns null as it never renders (redirect occurs first)
 *   - Login page will handle further routing based on authentication state
 */

import type { GetServerSideProps } from "next";

/**
 * Server-side props handler that redirects root URL to login page.
 * Executes before any rendering occurs, ensuring immediate redirect.
 *
 * @returns Redirect configuration object for Next.js
 */
export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/login",
      permanent: false,
    },
  };
};

/**
 * Root index page component.
 * Never renders as server-side redirect occurs first.
 *
 * @returns null (component never actually renders)
 */
export default function Index() {
  return null;
}
