
import { useState, useEffect } from "react";
import { GetServerSideProps } from 'next';
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { useLoading } from "@/hooks/use-loading";
import { requireAuthGetServerSideProps } from "@/lib/server-auth";
import { apiGet, apiDelete } from "@/lib/api-client";
import { TrainingSheet } from "@/types";
import { 
  Plus, 
  Search, 
  Edit,
  Trash,
  Calendar,
  MoreVertical,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import TrainingScheduleDialogWizard from "@/components/dialogs/TrainingScheduleDialog_Wizard";
import { useToast } from "@/hooks/use-toast";
import { fadeUpIn, hoverScale, tapScale } from "@/lib/motion-variants";

const TrainingSchedule = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TrainingSheet | null>(null);
  const [schedules, setSchedules] = useState<TrainingSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { startLoading, stopLoading } = useLoading();

  async function loadSchedules() {
    setLoading(true);
    startLoading();
    try {
      const data = await apiGet<TrainingSheet[]>('/api/training-sheets');
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível carregar as agendas de treino.' });
    } finally {
      setLoading(false);
      stopLoading();
    }
  }

  useEffect(() => {
    loadSchedules();
  }, []);
  
  const filteredSchedules = schedules.filter(
    (schedule) =>
      schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.publicName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenEditDialog = (schedule: TrainingSheet) => {
    setEditingSchedule(schedule);
    setScheduleDialogOpen(true);
  };

  const handleAddNewSchedule = () => {
    setEditingSchedule(null);
    setScheduleDialogOpen(true);
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('Tem certeza que deseja deletar esta agenda?')) return;
    try {
      await apiDelete(`/api/training-sheets/${id}`);
      loadSchedules();
      toast({
        title: "Agenda excluída",
        description: "A agenda de treino foi removida com sucesso.",
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: 'Não foi possível deletar a agenda.' });
    }
  };

  const handleScheduleSuccess = () => {
    loadSchedules();
    toast({
      title: "Agenda salva",
      description: "A agenda foi salva com sucesso.",
    });
  };
  
  return (
    <Layout>
      <motion.div 
        className="w-full py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div 
          className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8"
          variants={fadeUpIn}
          initial="hidden"
          animate="visible"
        >
          <div>
            <motion.h1 
              className="text-3xl font-bold tracking-tight"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Agendas de Treinos
            </motion.h1>
            <motion.p 
              className="text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Gerencie as agendas de treinos para seus alunos.
            </motion.p>
          </div>
          
          <motion.div
            whileHover="hover"
            whileTap="tap"
            variants={{ hover: hoverScale, tap: tapScale }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={handleAddNewSchedule}
            >
              <Plus className="h-4 w-4" />
              Nova Agenda
            </Button>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="flex flex-col md:flex-row gap-4 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por nome..."
              className="pl-9 transition-all duration-200 focus:ring-2"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <CardTitle className="text-lg font-medium">Agendas de Treinos</CardTitle>
                </motion.div>
                <Badge variant="outline">{filteredSchedules.length} agendas</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between py-3 px-4 border rounded"
                      >
                        <div className="flex-1">
                          <Skeleton className="h-4 w-32 mb-2" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key="table"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead className="text-right w-[180px]">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSchedules.length > 0 ? (
                            <AnimatePresence mode="popLayout">
                              {filteredSchedules.map((schedule, idx) => (
                                <motion.tr
                                  key={schedule.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -10 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className="border-b hover:bg-muted/50 transition-colors"
                                  whileHover={{ scale: 1.01 }}
                                >
                                  <TableCell className="font-medium">{schedule.id}</TableCell>
                                  <TableCell>{schedule.name}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground line-clamp-1">
                                    {schedule.publicName || '-'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8"
                                          title="Visualizar agenda"
                                        >
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </motion.div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <motion.div
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                          >
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                              <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </motion.div>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem 
                                            className="gap-2"
                                            onClick={() => handleOpenEditDialog(schedule)}
                                          >
                                            <Edit className="h-4 w-4" /> Editar
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem 
                                            className="text-destructive gap-2"
                                            onClick={() => handleDeleteSchedule(schedule.id)}
                                          >
                                            <Trash className="h-4 w-4" /> Excluir
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </TableCell>
                                </motion.tr>
                              ))}
                            </AnimatePresence>
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center">
                                <motion.div 
                                  className="flex flex-col items-center justify-center"
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                >
                                  <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                                  <p className="text-muted-foreground">Nenhuma agenda encontrada</p>
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.div 
                className="flex items-center justify-end space-x-2 py-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex-1 text-sm text-muted-foreground">
                  Exibindo <span className="font-medium">{filteredSchedules.length}</span> de{" "}
                  <span className="font-medium">{schedules.length}</span> agendas
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        <TrainingScheduleDialogWizard
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          editingData={editingSchedule}
          onSaved={handleScheduleSuccess}
        />
      </motion.div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = requireAuthGetServerSideProps;

export default TrainingSchedule;
