import ProfileDialog from '@/components/profile/ProfileDialog';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Menu, Bell, User, LogOut, CheckCircle2 } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavbarProps {
  toggleDrawer: () => void;
  isAuthenticated?: boolean;
  transparent?: boolean;
}

export const Navbar = ({
  toggleDrawer,
  isAuthenticated = false,
  transparent = false,
}: NavbarProps) => {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const { data: session } = useSession();
  const user = session?.user;

  const displayName = user?.name ?? 'Usuário';
  const displayEmail = user?.email ?? 'usuario@exemplo.com';
  const initials = user?.name
    ? user.name
        .split(' ')
        .map(s => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.email
      ? user.email.charAt(0).toUpperCase()
      : 'TT';

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handler);
      return () => window.removeEventListener('scroll', handler);
    }
    return () => {};
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <motion.header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-4 px-4',
        {
          'bg-transparent': transparent && !scrolled,
          'bg-white/80 backdrop-blur-md shadow-sm': scrolled || !transparent,
        }
      )}
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        duration: 0.4,
      }}
    >
      <div className="flex items-center justify-center w-full">
        <div className="w-full max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDrawer}
                className="mr-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <motion.div
              className="font-bold text-xl text-primary tracking-tight cursor-pointer"
              onClick={() => isAuthenticated && router.push('/home')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
              }}
            >
              Tay Training
            </motion.div>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="end">
                    <DropdownMenuLabel className="font-semibold flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Notificações
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Nenhuma notificação
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Você está em dia com tudo!
                      </p>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {displayName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {displayEmail}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <ProfileDialog />
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" /> Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                className="bg-primary hover:bg-primary/90 transition-all"
                onClick={() => router.push('/login')}
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
