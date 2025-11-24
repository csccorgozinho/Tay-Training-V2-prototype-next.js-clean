import LoginForm from '../src/components/auth/LoginForm';
import { Layout } from '../src/components/layout/Layout';
import { GetServerSideProps } from 'next';
import { redirectAuthenticatedGetServerSideProps } from '../src/lib/server-auth';

const LoginPage = () => {
  return (
  <Layout hideNavbar>
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12 bg-accent/30">
      <div className="w-full max-w-md mx-auto mb-6 text-center">
        <h1 className="text-3xl font-bold text-primary mb-1">Tay Training</h1>
        <p className="text-muted-foreground">Acesse sua conta</p>
      </div>
      <div className="glass-effect w-full max-w-md p-8 rounded-xl">
        <LoginForm />
      </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = redirectAuthenticatedGetServerSideProps;

export default LoginPage;