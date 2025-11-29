"use strict";

/**
 * File: Home.tsx
 * Description: Dashboard/home page component displaying overview statistics and quick access to main features.
 * Shows real-time counts of exercises, methods, workout sheets, and training schedules with animated cards.
 * Responsibilities:
 *   - Render dashboard overview with statistics cards
 *   - Load counts from multiple API endpoints concurrently
 *   - Display quick access cards with navigation to main sections
 *   - Show activity tracking placeholder (future feature)
 *   - Display summary statistics in a separate card
 *   - Handle loading states and error notifications
 *   - Provide animated UI transitions with Framer Motion
 *   - Navigate to different sections on card click
 * Called by:
 *   - Next.js routing system (accessed via / or /home route)
 *   - Navigation menu items in Layout component
 *   - Authentication redirect (after successful login)
 * Notes:
 *   - Requires authentication (enforced by requireAuthGetServerSideProps)
 *   - Loads data from 4 different API endpoints in parallel
 *   - Uses Framer Motion for animations and transitions
 *   - Activity tracking section is a placeholder for future functionality
 *   - Counts are loaded on component mount and stored in local state
 *   - Error handling shows toast notifications for failed API calls
 *   - All API calls are made concurrently using Promise.all for performance
 *   - Fallback values (0) are used if API calls fail or return invalid data
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { motion } from "framer-motion";
import { useLoading } from "@/hooks/use-loading";
import { useToast } from "@/hooks/use-toast";
import { requireAuthGetServerSideProps } from "@/lib/server-auth";
import {
  Dumbbell,
  ClipboardList,
  Layers,
  Calendar,
  ArrowRight,
  Activity,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  fadeUpIn,
  listContainer,
  listItem,
  hoverLift,
  tapScale,
  gridContainer,
  gridItem,
} from "@/lib/motion-variants";

// ============================================
// Type Definitions
// ============================================

/**
 * Statistics counts for dashboard display.
 */
interface Counts {
  /** Number of exercises in the system */
  exercises: number;
  /** Number of training methods in the system */
  methods: number;
  /** Number of workout sheets in the system */
  workoutSheets: number;
  /** Number of training schedules in the system */
  trainings: number;
}

/**
 * Quick access card configuration.
 */
interface QuickAccessItem {
  /** Display title for the card */
  title: string;
  /** Icon component to display */
  icon: React.ComponentType<{ className?: string }>;
  /** Navigation path */
  path: string;
  /** Count to display */
  count: number;
  /** Tailwind color classes for the icon background */
  color: string;
}

/**
 * API response structure for count endpoints.
 */
interface CountResponse {
  success?: boolean;
  meta?: {
    total?: number;
  };
  data?: unknown;
}

// ============================================
// Constants
// ============================================

/**
 * Initial counts state with default values.
 */
const INITIAL_COUNTS: Counts = {
  exercises: 0,
  methods: 0,
  workoutSheets: 0,
  trainings: 0,
};

/**
 * API endpoint paths.
 */
const API_ENDPOINTS = {
  EXERCISES: "/api/db/exercises",
  METHODS: "/api/db/methods",
  EXERCISE_GROUPS: "/api/exercise-groups",
  TRAINING_SHEETS: "/api/training-sheets",
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Check if a value is a valid non-negative integer.
 */
function isValidCount(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * Safely extract count from API response.
 */
function extractCount(response: unknown): number {
  if (typeof response !== "object" || response === null) {
    return 0;
  }

  const data = response as CountResponse;

  if (data.meta && typeof data.meta.total === "number") {
    return isValidCount(data.meta.total) ? data.meta.total : 0;
  }

  return 0;
}

/**
 * Fetch count from a single API endpoint.
 */
async function fetchCount(url: string): Promise<number> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      console.error(`Failed to fetch from ${url}: ${response.status}`);
      return 0;
    }

    const data: CountResponse = await response.json();
    return extractCount(data);
  } catch (error) {
    console.error(`Error fetching from ${url}:`, error);
    return 0;
  }
}

// ============================================
// Main Component
// ============================================

/**
 * Home/Dashboard page component.
 * Displays overview statistics and quick access navigation.
 */
const Home = (): JSX.Element => {
  const router = useRouter();
  const { startLoading, stopLoading } = useLoading();
  const { toast } = useToast();

  const [counts, setCounts] = useState<Counts>(INITIAL_COUNTS);

  /**
   * Load all counts from API endpoints concurrently.
   */
  async function loadCounts(): Promise<void> {
    startLoading();

    try {
      const [exercisesCount, methodsCount, workoutSheetsCount, trainingsCount] =
        await Promise.all([
          fetchCount(API_ENDPOINTS.EXERCISES),
          fetchCount(API_ENDPOINTS.METHODS),
          fetchCount(API_ENDPOINTS.EXERCISE_GROUPS),
          fetchCount(API_ENDPOINTS.TRAINING_SHEETS),
        ]);

      setCounts({
        exercises: exercisesCount,
        methods: methodsCount,
        workoutSheets: workoutSheetsCount,
        trainings: trainingsCount,
      });
    } catch (error) {
      console.error("Failed to load counts:", error);

      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as informações do painel.",
      });

      setCounts(INITIAL_COUNTS);
    } finally {
      stopLoading();
    }
  }

  /**
   * Navigate to a specific path.
   */
  function navigateTo(path: string): void {
    if (typeof path === "string" && path.length > 0) {
      router.push(path);
    }
  }

  // Load counts on component mount
  useEffect(() => {
    loadCounts();
  }, []);

  // Quick access items configuration
  const quickAccessItems: QuickAccessItem[] = [
    {
      title: "Exercícios",
      icon: Dumbbell,
      path: "/exercises",
      count: counts.exercises,
      color: "bg-blue-500/10 text-blue-500",
    },
    {
      title: "Métodos de Treino",
      icon: ClipboardList,
      path: "/methods",
      count: counts.methods,
      color: "bg-green-500/10 text-green-500",
    },
    {
      title: "Fichas de Treino",
      icon: Layers,
      path: "/workout-sheets",
      count: counts.workoutSheets,
      color: "bg-purple-500/10 text-purple-500",
    },
    {
      title: "Treinos",
      icon: Calendar,
      path: "/training-schedule",
      count: counts.trainings,
      color: "bg-orange-500/10 text-orange-500",
    },
  ];

  // Summary items for the summary card
  const summaryItems = [
    { label: "Exercícios cadastrados", value: counts.exercises },
    { label: "Métodos de treino", value: counts.methods },
    { label: "Fichas criadas", value: counts.workoutSheets },
    { label: "Treinos programados", value: counts.trainings },
  ];

  return (
    <Layout>
      <motion.div
        className="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header Section */}
        <motion.header
          className="mb-6 sm:mb-8"
          variants={fadeUpIn}
          initial="hidden"
          animate="visible"
        >
          <h1 className="text-3xl font-bold tracking-tight">
            Painel de Controle
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo ao Tay Training, organize seus treinos.
          </p>
        </motion.header>

        {/* Quick Access Cards Grid */}
        <motion.div
          className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-6 sm:mb-8"
          variants={gridContainer}
          initial="hidden"
          animate="visible"
        >
          {quickAccessItems.map((item, index) => {
            const IconComponent = item.icon;

            return (
              <motion.div
                key={`quick-access-${item.path}-${index}`}
                variants={gridItem}
              >
                <motion.div
                  whileTap="tap"
                  variants={{ tap: tapScale }}
                  className="h-full"
                >
                  <Card className="transition-all duration-300 h-full cursor-pointer hover:-translate-y-1 hover:shadow-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                      >
                        <CardTitle className="text-lg font-medium">
                          {item.title}
                        </CardTitle>
                      </motion.div>
                      <motion.div
                        className={`rounded-full p-2 ${item.color}`}
                        whileHover={{ scale: 1.15, rotate: 8 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      >
                        <IconComponent className="h-5 w-5" />
                      </motion.div>
                    </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <motion.div
                            className="text-2xl font-bold"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                              delay: index * 0.1 + 0.3,
                              type: "spring",
                              stiffness: 300,
                              damping: 30,
                            }}
                          >
                            {item.count}
                          </motion.div>
                          <div className="text-xs text-muted-foreground">
                            Total
                          </div>
                        </div>
                        <motion.div
                          whileHover={{ x: 4 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1 transition-all"
                            onClick={() => navigateTo(item.path)}
                            aria-label={`Acessar ${item.title}`}
                          >
                            Acessar <ArrowRight className="h-3 w-3" />
                          </Button>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Activity and Summary Cards */}
        <motion.div
          className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2"
          variants={listContainer}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          {/* Activity Placeholder Card */}
          <motion.div variants={listItem}>
            <Card className="h-full bg-gradient-to-br from-slate-50/50 to-slate-50/30 dark:from-slate-900/20 dark:to-slate-900/10">
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Atividade em Breve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="h-8 w-8 text-primary opacity-60" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-medium">Rastreamento de Atividades</p>
                    <p className="text-sm text-muted-foreground">
                      Esta funcionalidade estará disponível em breve. Depende de
                      um aplicativo que ainda está sendo desenvolvido.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Summary Card */}
          <motion.div variants={listItem}>
            <Card className="h-full">
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
                  {summaryItems.map((item, idx) => (
                    <motion.div
                      key={`summary-${item.label}-${idx}`}
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
