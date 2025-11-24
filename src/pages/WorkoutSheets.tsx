
import { useState, useEffect } from "react";
import { GetServerSideProps } from 'next';
import { Layout } from "@/components/layout/Layout";
import { useWorkoutSheetsFilter } from "@/hooks/use-workout-sheets-filter";
import { useDialogHandlers } from "@/hooks/use-dialog-handlers";
import { usePagination } from "@/hooks/use-pagination";
import { requireAuthGetServerSideProps } from "@/lib/server-auth";
import { apiGet, apiPost } from "@/lib/api-client";
import { PAGINATION } from "@/config/constants";
import { 
  ChevronDown,
  Plus, 
  Search, 
  Filter, 
  Layers,
  MoreVertical, 
  Edit,
  Trash,
  Copy,
  Dumbbell,
  Calendar,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationUI } from "@/components/ui/pagination-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import WorkoutSheetDialog from "@/components/dialogs/WorkoutSheetDialog";
import { CategoryFilterDialog } from "@/components/dialogs/CategoryFilterDialog";
import { useToast } from "@/hooks/use-toast";
import { ExerciseGroup, WorkoutSheetTransformed, Category } from "@/types";

const WorkoutSheets = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [workoutSheets, setWorkoutSheets] = useState<WorkoutSheetTransformed[]>([]);
  const { toast } = useToast();
  const itemsPerPage = PAGINATION.SHEETS_PER_PAGE;
  
  // Use the new filter hook
  const {
    sheets,
    categories,
    selectedCategoryId,
    isLoading: filterLoading,
    error: filterError,
    setSelectedCategoryId,
    refreshSheets,
  } = useWorkoutSheetsFilter();

  // Dialog handlers
  const {
    isOpen: workoutSheetDialogOpen,
    editingItem: editingWorkoutSheet,
    openEditDialog: openEditDialogFromHook,
    openAddDialog,
    closeDialog,
    handleDelete,
  } = useDialogHandlers<ExerciseGroup>({
    itemName: 'grupo de exercícios',
    onLoadItems: async () => {
      refreshSheets();
    },
  });

  // Special handler for edit dialog that fetches full data
  const handleOpenEditDialog = async (sheet: WorkoutSheetTransformed) => {
    try {
      const fullGroup = await apiGet<ExerciseGroup>(`/api/exercise-groups/${sheet.id}`);
      openEditDialogFromHook(fullGroup);
    } catch (err) {
      console.error('Failed to fetch full sheet data:', err);
      toast({ title: 'Erro', description: 'Não foi possível carregar os dados do grupo.' });
    }
  };

    // Transform sheets from filter hook - this is the only data source
  useEffect(() => {
    const transformedSheets: WorkoutSheetTransformed[] = sheets.map((sheet: any) => {
      // Count exercises from exerciseMethods
      let totalExercises = 0;
      const methodNames: string[] = [];
      
      sheet.exerciseMethods?.forEach((method) => {
        const configCount = method.exerciseConfigurations?.length || 0;
        totalExercises += configCount;
        
        if (configCount > 0) {
          method.exerciseConfigurations?.forEach((config) => {
            if (config.method?.name && !methodNames.includes(config.method.name)) {
              methodNames.push(config.method.name);
            }
          });
        }
      });
      
      // Find the category name from the categories array
      const categoryName = categories.find(cat => cat.id === sheet.categoryId)?.name || 'Sem categoria';
      
      return {
        id: sheet.id,
        name: sheet.name || 'Sem nome',
        exercises: totalExercises,
        type: categoryName,
        methods: methodNames,
        lastUpdated: new Date(sheet.updatedAt).toLocaleDateString('pt-BR')
      };
    });
    
    setWorkoutSheets(transformedSheets);
  }, [sheets, categories]);

  const filteredWorkoutSheets = workoutSheets.filter(
    (sheet) =>
      sheet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sheet.methods && sheet.methods.length > 0 && sheet.methods.some(method => method.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Use pagination hook to manage pagination state and logic
  const {
    currentPage,
    totalPages,
    currentPageItems,
    setCurrentPage,
  } = usePagination({
    items: filteredWorkoutSheets,
    itemsPerPage,
    searchDependency: searchTerm,
  });

  // Map type to color
  const typeColor = {
    "Hipertrofia": "bg-purple-500/10 text-purple-500",
    "Força": "bg-blue-500/10 text-blue-500",
    "Resistência": "bg-orange-500/10 text-orange-500",
    "Geral": "bg-green-500/10 text-green-500"
  };

  const handleWorkoutSheetSuccess = (data: unknown) => {
    // Refresh the list after creation/update
    refreshSheets();
    toast({
      title: "Sucesso!",
      description: `Grupo de exercícios criado/atualizado com sucesso.`,
    });
  };

  const handleDuplicateWorkoutSheet = async (sheet: WorkoutSheetTransformed) => {
    try {
      // Fetch full sheet data first
      const fullGroup = await apiGet<ExerciseGroup>(`/api/exercise-groups/${sheet.id}`);

      // Determine new name - check for existing duplicates
      let newName = `${fullGroup.name} - Cópia`;
      let copyCount = 1;
      
      // Check if this name already exists in the current sheets
      while (workoutSheets.some(s => s.name === newName)) {
        copyCount++;
        newName = `${fullGroup.name} - Cópia ${copyCount}`;
      }

      // Create duplicate by copying the group
      await apiPost('/api/exercise-groups', {
        name: newName,
        categoryId: fullGroup.categoryId,
        exerciseMethods: fullGroup.exerciseMethods?.map((m) => ({
          rest: m.rest,
          observations: m.observations,
          exerciseConfigurations: m.exerciseConfigurations?.map((c) => ({
            exerciseId: c.exerciseId,
            methodId: c.methodId,
            series: c.series,
            reps: c.reps,
          })) || [],
        })) || [],
      });

      // Refresh the list
      refreshSheets();

      toast({
        title: "Grupo duplicado",
        description: `"${fullGroup.name}" foi duplicado como "${newName}"`,
      });
    } catch (err) {
      console.error('Error duplicating group:', err);
      toast({
        title: 'Erro',
        description: `Não foi possível duplicar o grupo. ${err instanceof Error ? err.message : ''}`,
      });
    }
  };
  
  return (
    <Layout>
      <div className="w-full animate-fade-in">
        <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Grupos de Exercícios</h1>
              <p className="text-muted-foreground">Crie e gerencie grupos de exercícios reutilizáveis.</p>
            </div>
            
            <Button 
              className="gap-2 bg-primary hover:bg-primary/90"
              onClick={openAddDialog}
            >
              <Plus className="h-4 w-4" />
              Novo Grupo
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar grupos de exercícios..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setFilterDialogOpen(true)}
            >
              <Filter className="h-4 w-4" />
              Filtrar
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
          
          {filterLoading ? (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border border-border/40">
                  <CardHeader>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-5 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {currentPageItems.map((sheet) => (
              <Card 
                key={sheet.id} 
                className="transition-all duration-300 hover:shadow-md border border-border/40 flex flex-col"
              >
                <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${typeColor[sheet.type as keyof typeof typeColor] || "bg-gray-500/10 text-gray-500"} hover:${typeColor[sheet.type as keyof typeof typeColor] || "bg-gray-500/10"}`}>
                        {sheet.type}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-medium">{sheet.name}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        className="gap-2"
                        onClick={() => handleOpenEditDialog(sheet)}
                      >
                        <Edit className="h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2"
                        onClick={() => handleDuplicateWorkoutSheet(sheet)}
                      >
                        <Copy className="h-4 w-4" /> Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive gap-2"
                        onClick={() => handleDelete(sheet.id, `/api/exercise-groups/${sheet.id}`)}
                      >
                        <Trash className="h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-muted p-2 rounded-md text-center flex flex-col items-center justify-center">
                      <Dumbbell className="h-4 w-4 mb-1 text-muted-foreground" />
                      <div className="text-lg font-semibold">{sheet.exercises}</div>
                      <div className="text-xs text-muted-foreground">Exercícios</div>
                    </div>
                    <div className="bg-muted p-2 rounded-md text-center flex flex-col items-center justify-center">
                      <Clock className="h-4 w-4 mb-1 text-muted-foreground" />
                      <div className="text-lg font-semibold">{sheet.methods.length}</div>
                      <div className="text-xs text-muted-foreground">Métodos</div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Métodos utilizados:</p>
                    <div className="flex flex-wrap gap-2">
                      {sheet.methods.map((method, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 text-xs text-muted-foreground flex justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Última atualização
                  </div>
                  <div>{sheet.lastUpdated}</div>
                </CardFooter>
              </Card>
            ))}
            </div>
          )}
          
          {/* Paginação */}
          {filteredWorkoutSheets.length > 0 && (
            <PaginationUI
              currentPage={currentPage}
              totalPages={totalPages}
              onPreviousPage={() => setCurrentPage(Math.max(currentPage - 1, 1))}
              onNextPage={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
              onPageSelect={setCurrentPage}
            />
          )}
          
          {filteredWorkoutSheets.length === 0 && !filterLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted rounded-full p-4 mb-4">
                <Layers className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum grupo encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar seus filtros ou adicione um novo grupo de exercícios.
              </p>
            </div>
          )}
        </div>

        <WorkoutSheetDialog 
          open={workoutSheetDialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeDialog();
            }
          }}
          isEditing={!!editingWorkoutSheet}
          initialData={editingWorkoutSheet}
          onSuccess={handleWorkoutSheetSuccess}
        />

        <CategoryFilterDialog
          open={filterDialogOpen}
          onOpenChange={setFilterDialogOpen}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={setSelectedCategoryId}
          isLoading={filterLoading}
          error={filterError}
        />
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = requireAuthGetServerSideProps;

export default WorkoutSheets;
