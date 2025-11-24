import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "@/hooks/use-loading";
import { ActivityTracker } from "@/lib/activity-tracker";
import { apiPost, apiPut, apiDelete } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fadeUpIn, modalSlideUpIn, listContainer, listItem, hoverScale, tapScale } from "@/lib/motion-variants";

interface MethodData {
  id?: number;
  name: string;
  description: string;
}

interface MethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing?: boolean;
  initialData?: MethodData | null;
  onSaved?: (method: MethodData) => void;
}

const MethodDialog = ({
  open,
  onOpenChange,
  isEditing = false,
  initialData,
  onSaved,
}: MethodDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const { startLoading, stopLoading } = useLoading();
  const { toast } = useToast();

  const isViewMode = !isEditing && !!initialData?.id;

  useEffect(() => {
    if (open && initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
    } else if (open) {
      setName("");
      setDescription("");
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      toast({ title: 'Erro', description: 'Nome e descrição são obrigatórios' });
      return;
    }

    setSaving(true);
    startLoading();
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
      };
      
      const json = isEditing && initialData?.id
        ? await apiPut(`/api/db/methods/${initialData.id}`, payload)
        : await apiPost('/api/db/methods', payload);
      
      // Track activity
      ActivityTracker.addActivity(name || 'Novo Método', 'Método');
      
      onSaved?.(json as MethodData);
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao salvar método';
      toast({ variant: 'destructive', title: 'Erro', description: errorMessage });
    } finally {
      setSaving(false);
      stopLoading();
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    
    if (!confirm('Tem certeza que deseja deletar este método?')) return;
    
    setSaving(true);
    startLoading();
    try {
      await apiDelete(`/api/db/methods/${initialData.id}`);
      toast({ 
        title: 'Método deletado', 
        description: 'O método foi removido com sucesso.' 
      });
      onSaved?.(initialData);
      onOpenChange(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar método';
      toast({ variant: 'destructive', title: 'Erro', description: errorMessage });
    } finally {
      setSaving(false);
      stopLoading();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <motion.div
          variants={modalSlideUpIn}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <DialogHeader className="px-6 pt-6 pb-2">
            <motion.div variants={fadeUpIn} initial="hidden" animate="visible">
              <DialogTitle>
                {isViewMode 
                  ? (initialData?.name || 'Método') 
                  : (isEditing ? "Editar Método" : "Novo Método")
                }
              </DialogTitle>
              <DialogDescription>
                {isViewMode
                  ? "Detalhes do método de treino"
                  : isEditing
                    ? "Atualize os detalhes do método de treino"
                    : "Preencha os detalhes para criar um novo método de treino"}
              </DialogDescription>
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
                  <motion.div variants={listItem}>
                    <h3 className="text-sm font-semibold mb-1">Descrição</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{initialData.description}</p>
                  </motion.div>
                </motion.div>
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
                <div className="px-6 py-4">
                  <motion.div 
                    className="grid gap-4"
                    variants={listContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div className="space-y-2" variants={listItem}>
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome do método"
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
                        placeholder="Descreva o método"
                        className="min-h-[100px] transition-all duration-200 focus:ring-2"
                        required
                      />
                    </motion.div>
                  </motion.div>
                </div>
                <DialogFooter className="px-6 py-4 bg-muted/30">
                  <motion.div
                    whileHover="hover"
                    whileTap="tap"
                    variants={{ hover: hoverScale, tap: tapScale }}
                  >
                    <Button type="submit" disabled={saving} className="gap-2">
                      <Save className="h-4 w-4" />
                      {saving ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar método"}
                    </Button>
                  </motion.div>
                </DialogFooter>
              </motion.form>
            )}
          </AnimatePresence>

          {isViewMode && (
            <DialogFooter className="px-6 py-4 bg-muted/30 border-t flex justify-between items-center">
              <motion.div
                whileHover="hover"
                whileTap="tap"
                variants={{ hover: { scale: 1.02 }, tap: { scale: 0.98 } }}
              >
                <Button 
                  variant="destructive"
                  className="gap-2"
                  onClick={handleDelete}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4" />
                  {saving ? 'Deletando...' : 'Deletar'}
                </Button>
              </motion.div>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
            </DialogFooter>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default MethodDialog;
