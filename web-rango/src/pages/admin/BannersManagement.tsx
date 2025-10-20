import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Power, GripVertical, Image, Video, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Banner,
  getAllBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  toggleBannerStatus,
  reorderBanners,
} from '@/services/bannerService';
import { CloudinaryUploadService } from '@/services/cloudinaryUploadService';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface BannerFormData {
  title: string;
  mediaType: 'image' | 'video';
  imageUrl: string;
  videoUrl: string;
  location: 'home' | 'category' | 'both';
  linkType: 'store' | 'category' | 'product' | 'external' | 'none';
  linkTarget: string;
  link: string;
  backgroundColor: string;
  isActive: boolean;
  order: number;
  startDate: string;
  endDate: string;
}

const defaultFormData: BannerFormData = {
  title: '',
  mediaType: 'image',
  imageUrl: '',
  videoUrl: '',
  location: 'home',
  linkType: 'none',
  linkTarget: '',
  link: '',
  backgroundColor: '#EA1D2C',
  isActive: true,
  order: 0,
  startDate: '',
  endDate: '',
};

function SortableBannerItem({ banner, onEdit, onDelete, onToggleStatus }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="cursor-move">
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>

            {/* Preview */}
            <div className="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0">
              {banner.videoUrl ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Video className="h-8 w-8 text-gray-400" />
                </div>
              ) : (
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{banner.title}</h3>
                {banner.videoUrl && (
                  <Badge variant="secondary" className="text-xs">
                    <Video className="h-3 w-3 mr-1" />
                    Vídeo
                  </Badge>
                )}
                {banner.linkType !== 'none' && (
                  <Badge variant="outline" className="text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {banner.linkType}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Ordem: {banner.order}</span>
                {banner.startDate && (
                  <span>Início: {new Date(banner.startDate).toLocaleDateString()}</span>
                )}
                {banner.endDate && (
                  <span>Fim: {new Date(banner.endDate).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Switch
                checked={banner.isActive}
                onCheckedChange={(checked) => onToggleStatus(banner.id, checked)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(banner)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(banner.id)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BannersManagement() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(defaultFormData);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await getAllBanners();
      setBanners(data);
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
      toast.error('Erro ao carregar banners');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setBanners((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Atualizar ordem no Firestore
        const bannerIds = newItems.map((item) => item.id!);
        reorderBanners(bannerIds).catch((error) => {
          console.error('Erro ao reordenar banners:', error);
          toast.error('Erro ao reordenar banners');
        });

        return newItems;
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await CloudinaryUploadService.uploadBannerImage(file);
      setFormData({ ...formData, imageUrl: url });
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const url = await CloudinaryUploadService.uploadBannerVideo(file);
      setFormData({ ...formData, videoUrl: url });
      toast.success('Vídeo enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar vídeo');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validação baseada no tipo de mídia
    if (!formData.title) {
      toast.error('Título é obrigatório');
      return;
    }

    if (formData.mediaType === 'image' && !formData.imageUrl) {
      toast.error('Imagem é obrigatória');
      return;
    }

    if (formData.mediaType === 'video' && !formData.videoUrl) {
      toast.error('Vídeo é obrigatório');
      return;
    }

    try {
      const bannerData: any = {
        title: formData.title,
        imageUrl: formData.mediaType === 'image' ? formData.imageUrl : (formData.imageUrl || 'https://via.placeholder.com/1920x1080'),
        videoUrl: formData.mediaType === 'video' ? formData.videoUrl : undefined,
        location: formData.location,
        linkType: formData.linkType,
        linkTarget: formData.linkTarget || undefined,
        link: formData.link || undefined,
        backgroundColor: formData.backgroundColor,
        isActive: formData.isActive,
        order: formData.order,
        startDate: formData.startDate ? new Date(formData.startDate) : undefined,
        endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      };

      if (editingBanner) {
        await updateBanner(editingBanner.id!, bannerData);
        toast.success('Banner atualizado com sucesso!');
      } else {
        await createBanner(bannerData);
        toast.success('Banner criado com sucesso!');
      }

      setDialogOpen(false);
      setEditingBanner(null);
      setFormData(defaultFormData);
      loadBanners();
    } catch (error) {
      console.error('Erro ao salvar banner:', error);
      toast.error('Erro ao salvar banner');
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      mediaType: banner.videoUrl ? 'video' : 'image',
      imageUrl: banner.imageUrl,
      videoUrl: banner.videoUrl || '',
      location: banner.location || 'home',
      linkType: banner.linkType,
      linkTarget: banner.linkTarget || '',
      link: banner.link || '',
      backgroundColor: banner.backgroundColor || '#EA1D2C',
      isActive: banner.isActive,
      order: banner.order,
      startDate: banner.startDate ? banner.startDate.toISOString().split('T')[0] : '',
      endDate: banner.endDate ? banner.endDate.toISOString().split('T')[0] : '',
    });
    setDialogOpen(true);
  };

  const confirmDelete = (bannerId: string) => {
    setBannerToDelete(bannerId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!bannerToDelete) return;

    try {
      await deleteBanner(bannerToDelete);
      toast.success('Banner deletado com sucesso!');
      loadBanners();
    } catch (error) {
      console.error('Erro ao deletar banner:', error);
      toast.error('Erro ao deletar banner');
    } finally {
      setDeleteDialogOpen(false);
      setBannerToDelete(null);
    }
  };

  const handleToggleStatus = async (bannerId: string, isActive: boolean) => {
    try {
      await toggleBannerStatus(bannerId, isActive);
      toast.success(`Banner ${isActive ? 'ativado' : 'desativado'} com sucesso!`);
      loadBanners();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do banner');
    }
  };

  const openNewDialog = () => {
    setEditingBanner(null);
    setFormData({
      ...defaultFormData,
      order: banners.length,
    });
    setDialogOpen(true);
  };

  const handleMediaTypeChange = (type: 'image' | 'video') => {
    setFormData({
      ...formData,
      mediaType: type,
      // Limpar o campo que não está sendo usado
      imageUrl: type === 'video' ? '' : formData.imageUrl,
      videoUrl: type === 'image' ? '' : formData.videoUrl,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Banners Promocionais</h1>
          <p className="text-gray-600 mt-1">
            Gerencie os banners exibidos no app (Tela Inicial e Categorias)
          </p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Banner
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">Carregando banners...</p>
          </CardContent>
        </Card>
      ) : banners.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Image className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum banner criado</h3>
            <p className="text-gray-600 mb-4">
              Crie seu primeiro banner para exibir promoções no app
            </p>
            <Button onClick={openNewDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={banners.map((b) => b.id!)}
            strategy={verticalListSortingStrategy}
          >
            {banners.map((banner) => (
              <SortableBannerItem
                key={banner.id}
                banner={banner}
                onEdit={handleEdit}
                onDelete={confirmDelete}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Dialog de Criar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? 'Editar Banner' : 'Novo Banner'}
            </DialogTitle>
            <DialogDescription>
              Crie banners visuais para a tela inicial do app. O título é apenas para sua referência.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título (apenas para referência) *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Banner 1, Banner Promocional, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                Este título não será exibido no app, apenas no dashboard para identificação
              </p>
            </div>

            <div>
              <Label htmlFor="mediaType">Tipo de Mídia *</Label>
              <Select
                value={formData.mediaType}
                onValueChange={(value: 'image' | 'video') => handleMediaTypeChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <span>Imagem</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <span>Vídeo</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Localização *</Label>
              <Select
                value={formData.location}
                onValueChange={(value: 'home' | 'category' | 'both') => setFormData({ ...formData, location: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Tela Inicial</SelectItem>
                  <SelectItem value="category">Tela de Categoria</SelectItem>
                  <SelectItem value="both">Ambas as Telas</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Escolha onde o banner será exibido no aplicativo
              </p>
            </div>

            {formData.mediaType === 'image' ? (
              <div>
                <Label htmlFor="image">Imagem do Banner *</Label>
                <div className="flex gap-2">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {formData.imageUrl && (
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded"
                    />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recomendado: 1920x1080px (16:9) - Full HD
                </p>
              </div>
            ) : (
              <div>
                <Label htmlFor="video">Vídeo do Banner *</Label>
                <div className="flex gap-2">
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={uploading}
                  />
                  {formData.videoUrl && (
                    <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                      <Video className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recomendado: 1920x1080px (16:9) - Full HD, máx 50MB
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="backgroundColor">Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="color"
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  className="w-20"
                />
                <Input
                  value={formData.backgroundColor}
                  onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                  placeholder="#EA1D2C"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="linkType">Tipo de Link</Label>
                <Select
                  value={formData.linkType}
                  onValueChange={(value: any) => setFormData({ ...formData, linkType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="store">Loja</SelectItem>
                    <SelectItem value="category">Categoria</SelectItem>
                    <SelectItem value="product">Produto</SelectItem>
                    <SelectItem value="external">Link Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.linkType !== 'none' && formData.linkType !== 'external' && (
                <div>
                  <Label htmlFor="linkTarget">ID do Destino</Label>
                  <Input
                    id="linkTarget"
                    value={formData.linkTarget}
                    onChange={(e) => setFormData({ ...formData, linkTarget: e.target.value })}
                    placeholder="ID da loja/categoria/produto"
                  />
                </div>
              )}

              {formData.linkType === 'external' && (
                <div>
                  <Label htmlFor="link">URL Externa</Label>
                  <Input
                    id="link"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data de Término</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Banner ativo</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={uploading}>
              {uploading ? 'Enviando...' : editingBanner ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Deleção */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O banner será permanentemente deletado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

