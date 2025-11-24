import * as React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Dumbbell,
  ClipboardList,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { listContainer, listItem } from '@/lib/motion-variants';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DRAWER_MENU_ITEMS = [
  { name: 'Exercícios', path: '/exercises', icon: Dumbbell },
  { name: 'Métodos de Treino', path: '/methods', icon: ClipboardList },
  { name: 'Fichas de Treino', path: '/workout-sheets', icon: Layers },
  { name: 'Treinos', path: '/training-schedule', icon: Calendar },
];

export const Drawer = ({ open, onOpenChange }: DrawerProps) => {
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger />
      <SheetContent
        side="left"
        className="p-0 w-[280px] border-r h-full flex flex-col"
      >
        <div className="flex flex-col h-full">
          <motion.div
            className="border-b py-6 px-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-semibold text-primary">Tay Training</h2>
          </motion.div>

          <motion.nav
            className="flex-1 py-4 overflow-y-auto"
            variants={listContainer}
            initial="hidden"
            animate="visible"
          >
            <ul className="space-y-1 px-2">
              {DRAWER_MENU_ITEMS.map(item => {
                const isActive = router.asPath === item.path;
                const Icon = item.icon;

                return (
                  <motion.li key={item.path} variants={listItem}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start text-left font-normal px-4 py-6 h-auto',
                        isActive && 'bg-primary/10 text-primary font-medium'
                      )}
                      onClick={() => handleNavigation(item.path)}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 mr-3',
                          isActive && 'text-primary'
                        )}
                      />
                      {item.name}
                      <motion.div
                        className="ml-auto"
                        animate={{ rotate: isActive ? 90 : 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 30,
                        }}
                      >
                        <ChevronRight
                          className={cn('h-4 w-4', isActive && 'text-primary')}
                        />
                      </motion.div>
                    </Button>
                  </motion.li>
                );
              })}
            </ul>
          </motion.nav>

          <motion.div
            className="border-t p-4 mt-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="pink-glass rounded-lg p-4 text-center">
              <p className="text-sm text-primary font-semibold">Tay Training v2</p>
              <p className="text-xs text-muted-foreground">© 2023</p>
            </div>
          </motion.div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Drawer;
