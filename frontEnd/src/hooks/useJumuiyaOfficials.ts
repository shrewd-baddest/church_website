import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_JUMUIYA_BASE } from '../utils/officialsApi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export interface JumuiyaOfficial {
  id: number;
  name: string;
  category: string;
  position: string;
  contact?: string;
  photo?: string;
  term_of_service?: string;
  status?: string;
}

export function useJumuiyaOfficials(filters: { termId?: number | string; category?: string } = {}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { termId, category } = filters;

  const officialsQuery = useQuery({
    queryKey: ['jumuiya-officials', termId, category],
    queryFn: async () => {
      let url = `${API_JUMUIYA_BASE}/list`;
      const queryParams = new URLSearchParams();
      if (termId) queryParams.append('term_id', String(termId));
      if (category) queryParams.append('category', category);
      
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch Jumuiya officials');
      const json = await res.json();
      return json.data as JumuiyaOfficial[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch(API_JUMUIYA_BASE, { 
        method: 'POST', 
        body: formData,
        headers: {
          'Authorization': `Bearer ${user?.accessToken}`
        }
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to add Jumuiya official');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jumuiya-officials'] });
      queryClient.invalidateQueries({ queryKey: ['currentTerm'] });
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      toast.success('Jumuiya official added successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: FormData }) => {
      const res = await fetch(`${API_JUMUIYA_BASE}/${id}`, { 
        method: 'PUT', 
        body: formData,
        headers: {
          'Authorization': `Bearer ${user?.accessToken}`
        }
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to update Jumuiya official');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jumuiya-officials'] });
      queryClient.invalidateQueries({ queryKey: ['currentTerm'] });
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      toast.success('Jumuiya official updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_JUMUIYA_BASE}/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user?.accessToken}`
        }
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to delete Jumuiya official');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jumuiya-officials'] });
      queryClient.invalidateQueries({ queryKey: ['currentTerm'] });
      queryClient.invalidateQueries({ queryKey: ['terms'] });
      toast.success('Jumuiya official deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    officials: officialsQuery.data || [],
    isLoading: officialsQuery.isLoading,
    isError: officialsQuery.isError,
    error: officialsQuery.error,
    refetch: officialsQuery.refetch,
    addOfficial: addMutation.mutateAsync,
    isAdding: addMutation.isPending,
    updateOfficial: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteOfficial: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
