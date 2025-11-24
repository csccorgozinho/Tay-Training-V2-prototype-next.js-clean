import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';

export default function Custom404() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-lg text-muted-foreground">Página não encontrada</p>
        <p className="text-sm text-muted-foreground">A página que você está procurando não existe.</p>
        <div className="flex gap-3 justify-center pt-4">
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
          <Button onClick={() => router.push('/login')}>
            Ir para Login
          </Button>
        </div>
      </div>
    </div>
  );
}

