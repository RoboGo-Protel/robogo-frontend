import { useQuery } from "@tanstack/react-query";

type MeResponse = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export const useMeQuery = () => {
  const query = useQuery<MeResponse, Error>({
    queryKey: ['me'],
    queryFn: async () => {
      console.log('useMeQuery: Fetching user data...');

      const res = await fetch('/api/auth/me', {
        cache: 'no-store',
      });

      console.log('useMeQuery: Response status:', res.status);

      if (res.status === 401) {
        console.log('useMeQuery: User not authenticated');
        throw new Error('Unauthorized');
      }

      if (!res.ok) {
        console.log('useMeQuery: Failed to fetch user');
        throw new Error('Failed to fetch user');
      }

      const json = await res.json();
      console.log('useMeQuery: User data fetched successfully:', json.data);
      return json.data;
    },
    staleTime: 1000 * 60 * 15, // 15 minutes - data tetap fresh lebih lama
    gcTime: 1000 * 60 * 60, // 1 hour - cache lebih lama
    retry: false,
    refetchOnWindowFocus: false, // Eksplisit disable untuk query ini
    refetchOnMount: false, // Tidak refetch setiap mount
    refetchOnReconnect: false, // Tidak refetch saat reconnect
    // Jangan refetch otomatis
    refetchInterval: false,
  });

  const unauthorized = query.error?.message === "Unauthorized";

  return { ...query, unauthorized };
};
