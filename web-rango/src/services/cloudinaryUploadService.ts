/**
 * 🌟 CLOUDINARY UPLOAD SERVICE - 100% GRATUITO
 * 
 * Substitui Firebase Storage (que exige Plano Blaze)
 * 
 * VANTAGENS:
 * - ✅ 25GB armazenamento grátis
 * - ✅ 25GB bandwidth/mês grátis
 * - ✅ 25.000 transformações/mês
 * - ✅ CDN global incluído
 * - ✅ Otimização automática de imagens
 * - ✅ SEM cartão de crédito necessário
 * 
 * CONFIGURAÇÃO:
 * 1. Criar conta: https://cloudinary.com/users/register_free
 * 2. Configurar .env com VITE_CLOUDINARY_CLOUD_NAME e VITE_CLOUDINARY_UPLOAD_PRESET
 */

interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

interface UploadResult {
  url: string;
  thumbnailUrl: string;
  publicId: string;
}

export class CloudinaryUploadService {
  
  private static readonly CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
  private static readonly UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';
  private static readonly IMAGE_API_URL = `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/image/upload`;
  private static readonly VIDEO_API_URL = `https://api.cloudinary.com/v1_1/${this.CLOUD_NAME}/video/upload`;
  
  private static readonly MAX_SIZE_MB = 5;
  private static readonly MAX_SIZE_BYTES = 5 * 1024 * 1024;
  private static readonly MAX_VIDEO_SIZE_MB = 50;
  private static readonly MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024;
  private static readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  private static readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

  /**
   * Upload de imagem de produto
   */
  static async uploadProductImage(
    file: File,
    folder: string = 'products',
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    
    try {
      // Validação
      this.validateImageFile(file);
      
      // Verificar configuração
      if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
        console.warn('⚠️ VITE_CLOUDINARY_CLOUD_NAME não configurado. Usando demo.');
      }
      
      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.UPLOAD_PRESET);
      formData.append('folder', folder);
      formData.append('resource_type', 'image');
      
      // Upload com progress tracking
      const response = await this.uploadWithProgress(formData, onProgress);
      
      const data: CloudinaryUploadResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao fazer upload');
      }
      
      // Gerar URL do thumbnail (Cloudinary faz isso automaticamente!)
      const thumbnailUrl = data.secure_url.replace(
        '/upload/',
        '/upload/w_400,h_400,c_fill,q_80/'
      );
      
      console.log('✅ Upload completo:', {
        url: data.secure_url,
        thumbnailUrl,
        publicId: data.public_id
      });
      
      return {
        url: data.secure_url,
        thumbnailUrl,
        publicId: data.public_id
      };
      
    } catch (error: any) {
      console.error('❌ Erro no upload Cloudinary:', error);
      throw new Error(error.message || 'Erro ao fazer upload da imagem');
    }
  }
  
  /**
   * Upload com tracking de progresso usando XMLHttpRequest
   */
  private static uploadWithProgress(
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<Response> {
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }
      
      // Completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new Response(xhr.responseText, { status: xhr.status }));
        } else {
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
        }
      });
      
      // Error
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });
      
      // Timeout (30 segundos)
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });
      
      xhr.open('POST', this.IMAGE_API_URL);
      xhr.timeout = 30000; // 30 segundos
      xhr.send(formData);
    });
  }

  /**
   * Upload com tracking de progresso para vídeos (timeout maior)
   */
  private static uploadVideoWithProgress(
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<Response> {
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }
      
      // Completion
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new Response(xhr.responseText, { status: xhr.status }));
        } else {
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
        }
      });
      
      // Error
      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });
      
      // Timeout (2 minutos para vídeos)
      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timeout'));
      });
      
      xhr.open('POST', this.VIDEO_API_URL);
      xhr.timeout = 120000; // 2 minutos
      xhr.send(formData);
    });
  }
  
  /**
   * Upload múltiplo
   */
  static async uploadMultipleImages(
    files: File[],
    folder: string = 'products',
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<UploadResult[]> {
    
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadProductImage(
          files[i],
          folder,
          (progress) => onProgress?.(i, progress)
        );
        results.push(result);
      } catch (error) {
        console.error(`❌ Erro no arquivo ${i + 1}:`, error);
        // Continua com os próximos
      }
    }
    
    return results;
  }
  
  /**
   * Deletar imagem
   * NOTA: Deleção no Cloudinary requer autenticação de servidor
   * Por enquanto, apenas loga o public_id para deleção manual
   */
  static async deleteImage(publicId: string): Promise<void> {
    try {
      console.log('🗑️ Para deletar imagens do Cloudinary, você precisa:');
      console.log('1. Criar endpoint backend autenticado');
      console.log('2. Ou deletar manualmente no painel: https://cloudinary.com/console/media_library');
      console.log('Public ID a deletar:', publicId);
      
      // TODO: Implementar endpoint backend para deleção autenticada
      // Exemplo: POST /api/delete-image com { publicId }
      
    } catch (error) {
      console.error('❌ Erro ao deletar:', error);
    }
  }
  
  /**
   * Deletar múltiplas imagens
   */
  static async deleteMultipleImages(publicIds: string[]): Promise<void> {
    for (const publicId of publicIds) {
      await this.deleteImage(publicId);
    }
  }
  
  /**
   * Upload de imagem de banner
   */
  static async uploadBannerImage(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    
    try {
      // Validação
      this.validateImageFile(file);
      
      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.UPLOAD_PRESET);
      formData.append('folder', 'banners');
      formData.append('resource_type', 'image');
      
      // Upload com progress tracking
      const response = await this.uploadWithProgress(formData, onProgress);
      
      const data: CloudinaryUploadResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao fazer upload');
      }
      
      console.log('✅ Banner image upload completo:', data.secure_url);
      
      return data.secure_url;
      
    } catch (error: any) {
      console.error('❌ Erro no upload de banner:', error);
      throw new Error(error.message || 'Erro ao fazer upload da imagem');
    }
  }

  /**
   * Upload de vídeo de banner
   */
  static async uploadBannerVideo(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    
    try {
      // Validação
      this.validateVideoFile(file);
      
      // Preparar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', this.UPLOAD_PRESET);
      formData.append('folder', 'banners/videos');
      formData.append('resource_type', 'video');
      
      // Upload com progress tracking
      const response = await this.uploadVideoWithProgress(formData, onProgress);
      
      const data: CloudinaryUploadResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao fazer upload');
      }
      
      console.log('✅ Banner video upload completo:', data.secure_url);
      
      return data.secure_url;
      
    } catch (error: any) {
      console.error('❌ Erro no upload de vídeo:', error);
      throw new Error(error.message || 'Erro ao fazer upload do vídeo');
    }
  }

  /**
   * Validação de arquivo de imagem
   */
  private static validateImageFile(file: File): void {
    // Tipo
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(
        `Formato inválido. Use: JPG, PNG ou WEBP`
      );
    }
    
    // Tamanho
    if (file.size > this.MAX_SIZE_BYTES) {
      throw new Error(`Imagem muito grande. Máximo: ${this.MAX_SIZE_MB}MB`);
    }
    
    // Nome
    if (!file.name || file.name.length === 0) {
      throw new Error('Nome do arquivo inválido');
    }
  }

  /**
   * Validação de arquivo de vídeo
   */
  private static validateVideoFile(file: File): void {
    // Tipo
    if (!this.ALLOWED_VIDEO_TYPES.includes(file.type)) {
      throw new Error(
        `Formato inválido. Use: MP4, WEBM ou OGG`
      );
    }
    
    // Tamanho
    if (file.size > this.MAX_VIDEO_SIZE_BYTES) {
      throw new Error(`Vídeo muito grande. Máximo: ${this.MAX_VIDEO_SIZE_MB}MB`);
    }
    
    // Nome
    if (!file.name || file.name.length === 0) {
      throw new Error('Nome do arquivo inválido');
    }
  }
  
  /**
   * Gerar URL otimizada com transformações on-the-fly
   * Cloudinary permite transformar imagens sem re-upload!
   */
  static getOptimizedUrl(
    url: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      crop?: 'fill' | 'fit' | 'scale' | 'crop';
      format?: 'auto' | 'jpg' | 'png' | 'webp';
    } = {}
  ): string {
    
    if (!url.includes('cloudinary.com')) {
      return url;
    }
    
    const {
      width,
      height,
      quality = 80,
      crop = 'fill',
      format = 'auto'
    } = options;
    
    let transformation = `/upload/f_${format},q_${quality}`;
    
    if (width) transformation += `,w_${width}`;
    if (height) transformation += `,h_${height}`;
    if (width && height) transformation += `,c_${crop}`;
    
    transformation += '/';
    
    return url.replace('/upload/', transformation);
  }
  
  /**
   * Gerar múltiplos tamanhos (responsive images)
   */
  static getResponsiveUrls(originalUrl: string): {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  } {
    return {
      thumbnail: this.getOptimizedUrl(originalUrl, { width: 200, height: 200 }),
      small: this.getOptimizedUrl(originalUrl, { width: 400 }),
      medium: this.getOptimizedUrl(originalUrl, { width: 800 }),
      large: this.getOptimizedUrl(originalUrl, { width: 1200 }),
      original: originalUrl
    };
  }
  
  /**
   * Verificar se configuração está correta
   */
  static isConfigured(): boolean {
    return !!(import.meta.env.VITE_CLOUDINARY_CLOUD_NAME && 
              import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
  }
  
  /**
   * Obter instruções de configuração
   */
  static getSetupInstructions(): string {
    return `
      📦 CLOUDINARY - CONFIGURAÇÃO (100% GRÁTIS)
      
      1. Criar conta gratuita:
         https://cloudinary.com/users/register_free
      
      2. No dashboard, anote:
         - Cloud Name
         - Upload Preset (criar em Settings > Upload)
      
      3. Criar arquivo .env:
         VITE_CLOUDINARY_CLOUD_NAME=seu_cloud_name
         VITE_CLOUDINARY_UPLOAD_PRESET=seu_preset
      
      4. Reiniciar servidor: npm run dev
      
      ✅ 25GB grátis + CDN global + Otimização automática!
    `;
  }
  
  /**
   * Validar URL de imagem
   */
  static isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
  
  /**
   * Obter tamanho do arquivo em MB
   */
  static getFileSizeMB(file: File): number {
    return parseFloat((file.size / (1024 * 1024)).toFixed(2));
  }
}

export default CloudinaryUploadService;

