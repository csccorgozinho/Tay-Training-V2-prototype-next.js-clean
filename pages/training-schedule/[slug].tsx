import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { requireAuthGetServerSideProps } from '@/lib/server-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ChevronRight } from 'lucide-react';
import { fadeUpIn, hoverScale } from '@/lib/motion-variants';

interface TrainingScheduleViewProps {
  schedule: {
    id: number;
    name: string;
    publicName: string | null;
    slug: string | null;
    pdfPath: string | null;
  };
}

const TrainingScheduleView = ({ schedule }: TrainingScheduleViewProps) => {
  const router = useRouter();
  const weeks = [1, 2, 3, 4];

  const handleWeekClick = (weekNumber: number) => {
    router.push(`/training-schedule/${schedule.slug}/week/${weekNumber}`);
  };

  const handleOpenPdf = () => {
    if (schedule.pdfPath) {
      window.open(schedule.pdfPath, '_blank');
    }
  };

  return (
    <Layout>
      <motion.div
        className="w-full min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="max-w-4xl mx-auto"
          variants={fadeUpIn}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {schedule.publicName || schedule.name}
            </h1>
            <p className="text-muted-foreground italic">
              Essa estrutura de treinos é uma sugestão de como organiza-los durante as semanas.
            </p>
          </motion.div>

          {/* Week Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {weeks.map((week, index) => (
              <motion.div
                key={week}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover="hover"
                variants={{ hover: hoverScale }}
              >
                <Card
                  className="cursor-pointer border-2 hover:border-primary transition-all duration-300 hover:shadow-lg bg-white dark:bg-slate-800"
                  onClick={() => handleWeekClick(week)}
                >
                  <CardContent className="p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-2">Semana {week}</h3>
                        <p className="text-sm text-muted-foreground">
                          Clique para visualizar os treinos
                        </p>
                      </div>
                      <motion.div
                        className="text-primary"
                        whileHover={{ x: 5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <ChevronRight className="h-8 w-8" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* PDF Button */}
          {schedule.pdfPath && (
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Button
                size="lg"
                onClick={handleOpenPdf}
                className="gap-2 text-lg px-8 py-6 bg-primary hover:bg-primary/90"
              >
                <FileText className="h-5 w-5" />
                Abrir PDF
              </Button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // First check authentication
  const authResult = await requireAuthGetServerSideProps(context);
  if ('redirect' in authResult || 'notFound' in authResult) {
    return authResult;
  }

  const { slug } = context.params as { slug: string };

  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/training-sheets/by-slug/${slug}`, {
      headers: {
        cookie: context.req.headers.cookie || '',
      },
    });

    if (!response.ok) {
      return { notFound: true };
    }

    const result = await response.json();

    if (!result.success || !result.data) {
      return { notFound: true };
    }

    return {
      props: {
        ...authResult.props,
        schedule: result.data,
      },
    };
  } catch (error) {
    console.error('Error fetching training schedule:', error);
    return { notFound: true };
  }
};

export default TrainingScheduleView;
