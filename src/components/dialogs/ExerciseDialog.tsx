import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/hooks/use-loading";
import { ActivityTracker } from "@/lib/activity-tracker";
import { apiPost, apiPut, apiDelete } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { VideoPlayer } from "@/components/ui/video-player";
import { Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fadeUpIn, modalSlideUpIn, listContainer, listItem, hoverScale, hoverLift, tapScale } from "@/lib/motion-variants";

// CLEANUP: Added interfaces for proper type safety
interface ExerciseData {
  id?: number;
  name: string;
  description: string;
  videoUrl?: string | null;
  hasMethod?: boolean;
}

interface ExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing?: boolean;
  initialData?: ExerciseData | null;
  onSaved?: (exercise: ExerciseData) => void;
}

const ExerciseDialog = ({
  open,
  onOpenChange,
  isEditing = false,
  initialData,
  onSaved,
}: ExerciseDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [hasMethod, setHasMethod] = useState(true);
  const [saving, setSaving] = useState(false);
  const { startLoading, stopLoading } = useLoading();
  const { toast } = useToast();
  const isViewMode = !isEditing && !!initialData?.id;

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setVideoUrl(initialData.videoUrl || null);
      setHasMethod(initialData.hasMethod !== false);
    } else if (open) {
      setName("");
      setDescription("");
      setVideoUrl(null);
      setHasMethod(true);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!description.trim()) {
      toast({ title: 'Erro', description: 'Descrição é obrigatória' });
      return;
    }
    setSaving(true);
    startLoading();
    try {
      const payload: Partial<ExerciseData> = {
        name: name || undefined,
        description: description.trim(),
        videoUrl: videoUrl || undefined,
        hasMethod,
      };
      
      const json = isEditing && initialData?.id
        ? await apiPut(`/api/db/exercises/${initialData.id}`, payload)
        : await apiPost('/api/db/exercises', payload);
      
      ActivityTracker.addActivity(name || 'Novo Exercício', 'Exercício');
      onSaved?.(json as ExerciseData);
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar exercício';
      toast({ variant: 'destructive', title: 'Erro', description: errorMessage });
    } finally {
      setSaving(false);
      stopLoading();
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!initialData?.id) return;
    
    if (!confirm('Tem certeza que deseja deletar este exercício?')) return;
    setSaving(true);
    startLoading();
    try {
      await apiDelete(`/api/db/exercises/${initialData.id}`);
      toast({ title: 'Sucesso', description: 'Exercício deletado com sucesso.' });
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar exercício';
      toast({ variant: 'destructive', title: 'Erro', description: errorMessage });
    } finally {
      setSaving(false);
      stopLoading();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden">
        <motion.div
          variants={modalSlideUpIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <DialogHeader className="px-6 pt-6 pb-2">
            <motion.div
              variants={fadeUpIn}
              initial="hidden"
              animate="visible"
            >
              <DialogTitle>
                {isViewMode 
                  ? (initialData?.name || 'Exercício') 
                  : (isEditing ? "Editar Exercício" : "Novo Exercício")
                }
              </DialogTitle>
            </motion.div>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {isViewMode && initialData ? (
              <motion.div
                key="view-mode"
                variants={fadeUpIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="px-6 py-4"
              >
                <motion.div 
                  className="grid gap-4"
                  variants={listContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {initialData.videoUrl && (
                    <motion.div variants={listItem}>
                      <VideoPlayer 
                        url={initialData.videoUrl} 
                        title={initialData.name || "Vídeo do Exercício"} 
                      />
                    </motion.div>
                  )}

                  <motion.div variants={listItem}>
                    <h3 className="text-sm font-semibold">Descrição</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{initialData.description || '-'}</p>
                  </motion.div>

                  {initialData.hasMethod && (
                    <motion.div variants={listItem}>
                      <h3 className="text-sm font-semibold">Utiliza método de treino específico</h3>
                      <p className="text-sm text-muted-foreground">Sim</p>
                    </motion.div>
                  )}
                </motion.div>
                <DialogFooter className="pt-4 flex justify-between items-center">
                  <motion.div
                    whileHover="hover"
                    whileTap="tap"
                    initial="initial"
                    variants={{ hover: hoverLift, tap: tapScale }}
                    className="w-full"
                  >
                    <Button 
                      variant="destructive"
                      className="gap-2 w-auto"
                      onClick={handleDelete}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                      {saving ? 'Deletando...' : 'Deletar'}
                    </Button>
                  </motion.div>
                  <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
                </DialogFooter>
              </motion.div>
            ) : (
              <motion.form 
                key="edit-mode"
                onSubmit={handleSubmit}
                variants={fadeUpIn}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <div className="px-6 py-4 overflow-y-auto max-h-[calc(100vh-200px)]">
                  <motion.div 
                    className="grid gap-5"
                    variants={listContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div className="space-y-2" variants={listItem}>
                      <Label htmlFor="name">Nome do Exercício *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome do exercício"
                        required
                        className="transition-all duration-200 focus:ring-2"
                      />
                    </motion.div>

                    <motion.div className="space-y-2" variants={listItem}>
                      <Label htmlFor="description">Descrição *</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Descreva como executar o exercício"
                        className="min-h-[100px] transition-all duration-200 focus:ring-2"
                        required
                      />
                    </motion.div>

                    <motion.div className="space-y-2" variants={listItem}>
                      <Label htmlFor="videoUrl">Link do vídeo</Label>
                      <Input
                        id="videoUrl"
                        value={videoUrl || ""}
                        onChange={(e) => setVideoUrl(e.target.value || null)}
                        placeholder="URL do vídeo demonstrativo (YouTube, Vimeo, etc.)"
                        className="transition-all duration-200 focus:ring-2"
                      />
                    </motion.div>

                    <motion.div className="flex items-center space-x-2" variants={listItem}>
                      <Checkbox
                        id="hasMethod"
                        checked={hasMethod}
                        onCheckedChange={(checked) => setHasMethod(checked as boolean)}
                      />
                      <Label htmlFor="hasMethod" className="cursor-pointer">
                        Este exercício utiliza método de treino específico
                      </Label>
                    </motion.div>
                  </motion.div>
                </div>
                <DialogFooter className="px-6 py-4 bg-muted/30">
                  <motion.div
                    whileHover="hover"
                    whileTap="tap"
                    variants={{ hover: hoverScale, tap: tapScale }}
                  >
                    <Button type="submit" className="gap-2" disabled={saving}>
                      <Save className="h-4 w-4" />
                      {saving ? 'Salvando...' : (isEditing ? "Salvar alterações" : "Criar exercício")}
                    </Button>
                  </motion.div>
                </DialogFooter>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseDialog;

