import type { AppProps } from 'next/app';
import '../src/index.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react'
import { LoadingBar } from '@/components/layout/LoadingBar';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider session={pageProps.session}>
        <TooltipProvider>
          <LoadingBar />
          <Toaster />
          <Sonner />
          <Component {...pageProps} />
        </TooltipProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}
