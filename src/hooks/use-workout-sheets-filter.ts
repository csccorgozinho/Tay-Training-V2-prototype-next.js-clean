import { useEffect, useState } from 'react';

export interface Category {
  id: number;
  name: string;
}

export interface WorkoutSheet {
  id: number;
  name: string;
  publicName: string | null;
  categoryId: number;
  createdAt: Date;
  updatedAt: Date;
  exerciseMethods?: unknown[];
}

interface UseWorkoutSheetsFilterResult {
  sheets: WorkoutSheet[];
  categories: Category[];
  selectedCategoryId: number | null;
  isLoading: boolean;
  error: string | null;
  setSelectedCategoryId: (categoryId: number | null) => void;
  refreshSheets: () => void;
}

export function useWorkoutSheetsFilter(): UseWorkoutSheetsFilterResult {
  const [sheets, setSheets] = useState<WorkoutSheet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSheets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const url = selectedCategoryId
          ? `/api/exercise-groups?categoryId=${selectedCategoryId}`
          : '/api/exercise-groups';

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch exercise groups');

        const data = await response.json();
        setSheets(data.data || data || []);
      } catch (err) {
        console.error('Error fetching sheets:', err);
        setError('Failed to load workout sheets');
        setSheets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSheets();
  }, [selectedCategoryId, refreshTrigger]);

  const refreshSheets = () => setRefreshTrigger(prev => prev + 1);

  return {
    sheets,
    categories,
    selectedCategoryId,
    isLoading,
    error,
    setSelectedCategoryId,
    refreshSheets,
  };
}
