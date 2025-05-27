import { useQuery } from "@tanstack/react-query";

type MeResponse = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export const useMeQuery = () => {
  const query = useQuery<MeResponse, Error>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      if (res.status === 401) {
        throw new Error("Unauthorized");
      }

      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }

      const json = await res.json();
      return json.data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: false,
  });

  const unauthorized = query.error?.message === "Unauthorized";

  return { ...query, unauthorized };
};
