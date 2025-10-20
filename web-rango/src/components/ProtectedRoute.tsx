import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingScreen } from './LoadingScreen';

interface ProtectedRouteProps {
  children: ReactNode;
  requireRole?: 'dono_da_loja' | 'store_owner' | 'dono_do_site';
}

/**
 * Componente de rota protegida
 * Redireciona para /login se o usuário não estiver autenticado
 * Opcionalmente verifica se o usuário tem a role necessária
 */
export const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return <LoadingScreen message="Verificando autenticação..." />;
  }

  // Redirecionar para login se não estiver autenticado
  if (!user) {
    console.log('🚫 ProtectedRoute: Usuário não autenticado, redirecionando para /login');
    return <Navigate to="/login" replace />;
  }

  // Verificar role específica se necessário
  if (requireRole && user.role !== requireRole) {
    console.log('🚫 ProtectedRoute: Usuário não tem a role necessária:', requireRole);
    return <Navigate to="/login" replace />;
  }

  // Usuário autenticado e com role correta
  return <>{children}</>;
};

