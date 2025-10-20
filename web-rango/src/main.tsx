import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

// Configurar React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - dados ficam "frescos"
      gcTime: 1000 * 60 * 30, // 30 minutos - tempo de garbage collection (antes era cacheTime)
      refetchOnWindowFocus: false, // Não refetch ao focar janela
      retry: 1, // Tentar apenas 1 vez em caso de erro
      refetchOnMount: false, // Não refetch ao montar se dados estão em cache
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
