import { useEffect, useState } from 'react';
import { useLoading } from '@/hooks/use-loading';

export const LoadingBar = () => {
  const { isLoading } = useLoading();
  const [progress, setProgress] = useState(0);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowBar(true);
      setProgress(10);

      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) {
            return prev + Math.random() * 30;
          }
          return prev;
        });
      }, 200);

      return () => clearInterval(interval);
    }

    setProgress(100);
    const timer = setTimeout(() => {
      setShowBar(false);
      setProgress(0);
    }, 500);

    return () => clearTimeout(timer);
  }, [isLoading]);

  if (!showBar) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[9999] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-300 ease-out shadow-lg"
        style={{
          width: `${progress}%`,
          boxShadow:
            progress > 0 ? '0 0 10px rgba(var(--primary), 0.5)' : 'none',
        }}
      />
    </div>
  );
};

export default LoadingBar;
