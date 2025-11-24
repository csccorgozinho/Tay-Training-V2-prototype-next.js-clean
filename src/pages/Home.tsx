import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from 'next';
import { motion } from "framer-motion";
import { useLoading } from "@/hooks/use-loading";
import { useToast } from "@/hooks/use-toast";
import { requireAuthGetServerSideProps } from "@/lib/server-auth";
import { ActivityTracker } from "@/lib/activity-tracker";
import { 
  Dumbbell, 
  ClipboardList, 
  Layers, 
  Calendar, 
  ArrowRight,
  Activity
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fadeUpIn, listContainer, listItem, hoverLift, tapScale, gridContainer, gridItem } from "@/lib/motion-variants";

interface Counts {
  exercises: number;
  methods: number;
  workoutSheets: number;
  trainings: number;
}

interface QuickAccessItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  count: number;
  color: string;
}

interface ActivityItem {
  name: string;
  type: string;
  date: string;
}

const Home = () => {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const { toast } = useToast();
  const [counts, setCounts] = useState<Counts>({
    exercises: 0,
    methods: 0,
    workoutSheets: 23,
    trainings: 8
  });

  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);

  const loadCounts = async (): Promise<void> => {
    startLoading();
    try {
      const [exercisesRes, methodsRes, groupsRes, trainingSheetsRes] = await Promise.all([
        fetch('/api/db/exercises'),
        fetch('/api/db/methods'),
        fetch('/api/exercise-groups'),
        fetch('/api/training-sheets')
      ]);

      if (exercisesRes.ok) {
        const data = await exercisesRes.json();
        setCounts(prev => ({ ...prev, exercises: data.data?.length || 0 }));
      } else {
        console.error('Failed to load exercises');
      }

      if (methodsRes.ok) {
        const data = await methodsRes.json();
        setCounts(prev => ({ ...prev, methods: data.data?.length || 0 }));
      } else {
        console.error('Failed to load methods');
      }

      if (groupsRes.ok) {
        const data = await groupsRes.json();
        setCounts(prev => ({ ...prev, workoutSheets: data.data?.length || 0 }));
      } else {
        console.error('Failed to load exercise groups');
      }

      if (trainingSheetsRes.ok) {
        const data = await trainingSheetsRes.json();
        setCounts(prev => ({ ...prev, trainings: data.data?.length || 0 }));
      } else {
        console.error('Failed to load training sheets');
      }
    } catch (err) {
      console.error('Failed to load counts:', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível carregar as informações do painel.' });
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    loadCounts();
    setRecentActivity(ActivityTracker.getActivities());
    const interval = setInterval(() => {
      loadCounts();
      setRecentActivity(ActivityTracker.getActivities());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const quickAccessItems: QuickAccessItem[] = [
    {
      title: "Exercícios",
      icon: Dumbbell,
      path: "/exercises",
      count: counts.exercises,
      color: "bg-blue-500/10 text-blue-500"
    },
    {
      title: "Métodos de Treino",
      icon: ClipboardList,
      path: "/methods",
      count: counts.methods,
      color: "bg-green-500/10 text-green-500"
    },
    {
      title: "Fichas de Treino",
      icon: Layers,
      path: "/workout-sheets",
      count: counts.workoutSheets,
      color: "bg-purple-500/10 text-purple-500"
    },
    {
      title: "Treinos",
      icon: Calendar,
      path: "/training-schedule",
      count: counts.trainings,
      color: "bg-orange-500/10 text-orange-500"
    }
  ];

  return (
    <Layout>
      <motion.div 
        className="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.header 
          className="mb-6 sm:mb-8"
          variants={fadeUpIn}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
          <p className="text-muted-foreground">Bem-vindo ao Tay Training, organize seus treinos.</p>
        </motion.header>

        <motion.div 
          className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6 sm:mb-8"
          variants={gridContainer}
          initial="hidden"
          animate="visible"
        >
          {quickAccessItems.map((item, index) => (
            <motion.div key={`${item.path}-${index}`} variants={gridItem}>
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={{ hover: hoverLift, tap: tapScale }}
                className="h-full"
              >
                <Card 
                  className="overflow-hidden transition-all duration-300 border border-border/40 h-full cursor-pointer relative group"
                >
                  {/* Animated background gradient */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                  
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 relative z-10">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      <CardTitle className="text-lg font-medium">{item.title}</CardTitle>
                    </motion.div>
                    <motion.div 
                      className={`rounded-full p-2 ${item.color}`}
                      whileHover={{ scale: 1.15, rotate: 8 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    >
                      <item.icon className="h-5 w-5" />
                    </motion.div>
                  </CardHeader>
                  <CardContent className="relative z-10">
                      <div className="flex items-center justify-between">
                        <div>
                          <motion.div 
                            className="text-2xl font-bold"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 + 0.3, type: 'spring', stiffness: 300, damping: 30 }}
                          >
                            {item.count}
                          </motion.div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        >
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs gap-1 transition-all"
                            onClick={() => router.push(item.path)}
                          >
                            Acessar <ArrowRight className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div 
          className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2"
          variants={listContainer}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <motion.div variants={listItem}>
            <Card className="border border-border/40 h-full">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Atividade Recente</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="space-y-4"
                  variants={listContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {recentActivity.map((activity, index) => (
                    <motion.div 
                      key={`${activity.name}-${index}`}
                      variants={listItem}
                      className="flex items-start gap-4 pb-4 border-b last:border-b-0 last:pb-0"
                    >
                      <motion.div 
                        className="bg-primary/10 text-primary h-9 w-9 rounded-full flex items-center justify-center shrink-0"
                        whileHover={{ scale: 1.1, rotate: 10 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      >
                        <Activity className="h-4 w-4" />
                      </motion.div>
                      <div className="flex-1">
                        <div className="font-medium">{activity.name}</div>
                        <div className="flex justify-between">
                          <span className="text-xs text-muted-foreground">{activity.type}</span>
                          <span className="text-xs text-muted-foreground">{activity.date}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={listItem}>
            <Card className="border border-border/40 h-full">
              <CardHeader>
                <CardTitle className="text-lg font-medium">Resumo</CardTitle>
              </CardHeader>
              <CardContent>
                <motion.div 
                  className="space-y-4"
                  variants={listContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {[
                    { label: "Exercícios cadastrados", value: counts.exercises },
                    { label: "Métodos de treino", value: counts.methods },
                    { label: "Fichas criadas", value: counts.workoutSheets },
                    { label: "Treinos programados", value: counts.trainings }
                  ].map((item, idx) => (
                    <motion.div 
                      key={`${item.label}-${idx}`}
                      variants={listItem}
                      className="flex justify-between items-center"
                    >
                      <div className="text-sm font-medium">{item.label}</div>
                      <motion.div 
                        className="font-semibold"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        {item.value}
                      </motion.div>
                    </motion.div>
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = requireAuthGetServerSideProps;

export default Home;
