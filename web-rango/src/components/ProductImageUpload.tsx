import React, { useState, useCallback, useRef } from 'react';
import { CloudinaryUploadService } from '@/services/cloudinaryUploadService';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Upload, X, Check, ImageIcon, Loader2, Star } from 'lucide-react';
import { MenuItemImage } from '@/types/menu-advanced';

interface ProductImageUploadProps {
  storeId: string;
  productId: string;
  images: MenuItemImage[];
  onImagesChange: (images: MenuItemImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  isCompleted: boolean;
  error?: string;
}

export const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  storeId,
  productId,
  images,
  onImagesChange,
  maxImages = 5,
  disabled = false
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const hasReachedLimit = images.length >= maxImages;
  const isUploading = uploadingFiles.length > 0;
  
  /**
   * Processa upload de arquivos
   */
  const handleFilesUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validar limite
    if (images.length + fileArray.length > maxImages) {
      alert(`Você pode adicionar no máximo ${maxImages} imagens`);
      return;
    }
    
    // Criar entradas de upload
    const newUploadingFiles: UploadingFile[] = fileArray.map(file => ({
      file,
      progress: 0,
      isCompleted: false
    }));
    
    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);
    
    // Upload de cada arquivo
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      const uploadIndex = uploadingFiles.length + i;
      
      try {
        const result = await CloudinaryUploadService.uploadProductImage(
          file,
          `stores/${storeId}/products/${productId}`,
          (progress) => {
            setUploadingFiles(prev => 
              prev.map((uf, idx) => 
                idx === uploadIndex ? { ...uf, progress } : uf
              )
            );
          }
        );
        
        // Marcar como completo
        setUploadingFiles(prev => 
          prev.map((uf, idx) => 
            idx === uploadIndex ? { ...uf, isCompleted: true, progress: 100 } : uf
          )
        );
        
        // Adicionar à lista de imagens
        const newImage: MenuItemImage = {
          id: `img-${Date.now()}-${i}`,
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          storageRef: result.publicId, // Cloudinary usa publicId
          isPrimary: images.length === 0, // Primeira imagem é primary
          order: images.length + i,
          uploadedAt: new Date()
        };
        
        onImagesChange([...images, newImage]);
        
      } catch (error: any) {
        console.error('Erro ao fazer upload:', error);
        
        setUploadingFiles(prev => 
          prev.map((uf, idx) => 
            idx === uploadIndex 
              ? { ...uf, error: error.message, isCompleted: true } 
              : uf
          )
        );
      }
    }
    
    // Limpar arquivos em upload após 2 segundos
    setTimeout(() => {
      setUploadingFiles([]);
    }, 2000);
    
  }, [images, onImagesChange, storeId, productId, maxImages, uploadingFiles.length]);
  
  /**
   * Handler para seleção de arquivo
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  /**
   * Handler para drag & drop
   */
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesUpload(files);
    }
  }, [disabled, handleFilesUpload]);
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);
  
  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);
  
  /**
   * Remove imagem
   */
  const handleRemoveImage = async (image: MenuItemImage) => {
    if (!confirm('Deseja remover esta imagem?')) return;
    
    try {
      // Deletar do Cloudinary (se possível)
      if (image.storageRef) {
        await CloudinaryUploadService.deleteImage(image.storageRef);
      }
      
      // Remover da lista
      const newImages = images.filter(img => img.id !== image.id);
      
      // Se era primary e ainda há imagens, tornar a primeira primary
      if (image.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      
      onImagesChange(newImages);
      
    } catch (error) {
      console.error('Erro ao remover imagem:', error);
      alert('Erro ao remover imagem. Tente novamente.');
    }
  };
  
  /**
   * Define imagem como principal
   */
  const handleSetPrimary = (imageId: string) => {
    const newImages = images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    }));
    onImagesChange(newImages);
  };
  
  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border'}
          ${hasReachedLimit || disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary/50'}
        `}
      >
        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="mx-auto h-12 w-12 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">
              Fazendo upload de {uploadingFiles.length} imagem(s)...
            </p>
            {uploadingFiles.map((uf, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground truncate">
                    {uf.file.name}
                  </span>
                  <span className="text-muted-foreground">
                    {uf.isCompleted ? (
                      uf.error ? (
                        <span className="text-destructive">{uf.error}</span>
                      ) : (
                        <Check className="h-4 w-4 text-green-500" />
                      )
                    ) : (
                      `${uf.progress}%`
                    )}
                  </span>
                </div>
                <Progress value={uf.progress} />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                <Upload className="h-6 w-6 text-primary absolute -bottom-1 -right-1" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">
              {hasReachedLimit 
                ? `Limite de ${maxImages} imagens atingido` 
                : 'Arraste imagens aqui ou clique para selecionar'
              }
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              PNG, JPG ou WebP (máx. 5MB)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={hasReachedLimit || disabled}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={hasReachedLimit || disabled}
              variant="outline"
            >
              <Upload className="h-4 w-4 mr-2" />
              Selecionar Imagens
            </Button>
          </div>
        )}
      </div>
      
      {/* Grid de Imagens */}
      {images.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            Imagens ({images.length}/{maxImages})
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <Card key={image.id} className="relative overflow-hidden group">
                {/* Badge de Principal */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Principal
                    </div>
                  </div>
                )}
                
                {/* Imagem */}
                <div className="aspect-square relative">
                  <img 
                    src={image.thumbnailUrl || image.url} 
                    alt={`Imagem ${image.order + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay com ações */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    {!image.isPrimary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSetPrimary(image.id)}
                        className="h-8 text-xs"
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Principal
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveImage(image)}
                      className="h-8"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {images.length === 0 && !isUploading && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p className="text-sm">Nenhuma imagem adicionada</p>
        </div>
      )}
    </div>
  );
};

export default ProductImageUpload; 