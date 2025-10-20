import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CloudinaryUploadService } from '@/services/cloudinaryUploadService';

interface ImageUploaderProps {
  currentImage?: string;
  onImageUploaded: (url: string) => void;
  folder?: string;
  aspectRatio?: 'square' | 'banner' | 'auto';
  label: string;
  description?: string;
  maxSizeMB?: number;
}

export const ImageUploader = ({
  currentImage,
  onImageUploaded,
  folder = 'stores',
  aspectRatio = 'auto',
  label,
  description,
  maxSizeMB = 5
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validações
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato inválido. Use JPG, PNG ou WEBP');
      return;
    }

    const sizeMB = CloudinaryUploadService.getFileSizeMB(file);
    if (sizeMB > maxSizeMB) {
      setError(`Imagem muito grande. Máximo: ${maxSizeMB}MB`);
      return;
    }

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      setUploading(true);
      setProgress(0);

      const result = await CloudinaryUploadService.uploadProductImage(
        file,
        folder,
        (progressValue) => {
          setProgress(progressValue);
        }
      );

      console.log('✅ Upload completo:', result);
      onImageUploaded(result.url);
      setPreviewUrl(result.url);
      
    } catch (err: any) {
      console.error('❌ Erro no upload:', err);
      setError(err.message || 'Erro ao fazer upload');
      setPreviewUrl(currentImage || null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onImageUploaded('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'banner':
        return 'aspect-[16/6]'; // Reduzido de 21/9 para 16/6 (mais compacto)
      default:
        return 'aspect-video';
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      <Card className="overflow-hidden">
        {previewUrl ? (
          <div className="relative group">
            <div className={`w-full ${getAspectRatioClass()} bg-muted`}>
              <img
                src={previewUrl}
                alt={label}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Overlay de ações */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                Trocar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                disabled={uploading}
              >
                <X className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>

            {/* Progress bar durante upload */}
            {uploading && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <div className="flex-1">
                    <Progress value={progress} className="h-2" />
                  </div>
                  <span className="text-sm text-white font-medium">
                    {progress}%
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={`w-full ${getAspectRatioClass()} bg-muted hover:bg-muted/80 transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                <div className="w-48">
                  <Progress value={progress} className="h-2" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Fazendo upload... {progress}%
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    Clique para adicionar imagem
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG ou WEBP (máx. {maxSizeMB}MB)
                  </p>
                </div>
              </>
            )}
          </button>
        )}
      </Card>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

