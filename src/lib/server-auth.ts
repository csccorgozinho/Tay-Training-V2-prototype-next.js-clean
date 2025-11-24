import { GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth';
import { authConfig } from './auth-config';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AppSession extends Session {
  user: User;
}

interface AuthResult {
  authenticated: boolean;
  session: AppSession | null;
}

/**
 * Check if user is authenticated via server-side session
 */
export async function getServerAuth(context: GetServerSidePropsContext): Promise<AuthResult> {
  try {
    const session = await getServerSession(context.req, context.res, authConfig) as AppSession | null;
    
    return {
      authenticated: !!(session?.user?.id),
      session,
    };
  } catch (error) {
    console.error('[Auth Error]', error);
    return {
      authenticated: false,
      session: null,
    };
  }
}

/**
 * Require authentication for a page
 * Redirects to login if not authenticated
 */
export async function requireAuthGetServerSideProps(context: GetServerSidePropsContext) {
  const { authenticated, session } = await getServerAuth(context);

  if (!authenticated) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const cleanSession: Partial<AppSession> | null = session ? {
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  } : null;

  return {
    props: {
      session: cleanSession,
    },
  };
}

/**
 * Redirect authenticated users away from auth pages (login, forgot-password)
 */
export async function redirectAuthenticatedGetServerSideProps(context: GetServerSidePropsContext) {
  const { authenticated } = await getServerAuth(context);

  if (authenticated) {
    return {
      redirect: {
        destination: '/home',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}

