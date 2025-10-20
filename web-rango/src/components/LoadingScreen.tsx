import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Carregando...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <img 
            src="/logo.png" 
            alt="Rappy" 
            className="h-24 w-auto animate-pulse"
          />
        </div>
        
        {/* App Name */}
        <h1 className="text-3xl font-bold text-foreground mb-6">
          Rappy
        </h1>
        
        {/* Spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        
        {/* Message */}
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

