import { useCallback, useState } from 'react';
import { apiDelete } from '@/lib/api-client';
import { useToast } from './use-toast';

interface DialogState<T> {
  isOpen: boolean;
  editingItem: T | null;
  selectedItem: T | null;
}

interface DialogHandlerConfig<T> {
  itemName: string;
  onLoadItems: () => Promise<void>;
  onDeleteError?: (item: T, error: Error) => void;
}

export const useDialogHandlers = <T extends { id: number }>(
  config: DialogHandlerConfig<T>
) => {
  const { toast } = useToast();
  const [state, setState] = useState<DialogState<T>>({
    isOpen: false,
    editingItem: null,
    selectedItem: null,
  });

  const openEditDialog = useCallback((item: T) => {
    setState({ isOpen: true, editingItem: item, selectedItem: null });
  }, []);

  const openViewDialog = useCallback((item: T) => {
    setState({ isOpen: true, editingItem: null, selectedItem: item });
  }, []);

  const openAddDialog = useCallback(() => {
    setState({ isOpen: true, editingItem: null, selectedItem: null });
  }, []);

  const closeDialog = useCallback(() => {
    setState({ isOpen: false, editingItem: null, selectedItem: null });
  }, []);

  const handleDelete = useCallback(
    async (id: number, apiEndpoint: string): Promise<void> => {
      const itemLabel = config.itemName;
      if (!confirm(`Tem certeza que deseja deletar este ${itemLabel}?`)) {
        return;
      }

      try {
        await apiDelete(apiEndpoint);
        await config.onLoadItems();
        toast({
          title: `${itemLabel.charAt(0).toUpperCase()}${itemLabel.slice(1)} deletado`,
          description: `O ${itemLabel} foi removido com sucesso.`,
        });
      } catch (err) {
        console.error(`Error deleting ${itemLabel}:`, err);
        const errorItem = state.editingItem || state.selectedItem;
        if (errorItem && config.onDeleteError) {
          config.onDeleteError(errorItem, err as Error);
        }
        toast({
          title: 'Erro',
          description: `Não foi possível deletar o ${itemLabel}.`,
          variant: 'destructive',
        });
      }
    },
    [state.editingItem, state.selectedItem, config, toast]
  );

  const setEditingItem = useCallback((item: T | null) => {
    setState(prev => ({ ...prev, editingItem: item }));
  }, []);

  const setSelectedItem = useCallback((item: T | null) => {
    setState(prev => ({ ...prev, selectedItem: item }));
  }, []);

  return {
    isOpen: state.isOpen,
    editingItem: state.editingItem,
    selectedItem: state.selectedItem,
    isEditing: !!state.editingItem,
    isViewing: !!state.selectedItem && !state.editingItem,
    openEditDialog,
    openViewDialog,
    openAddDialog,
    closeDialog,
    handleDelete,
    setEditingItem,
    setSelectedItem,
  };
};
