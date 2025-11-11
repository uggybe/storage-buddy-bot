import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Item = {
  id: string;
  name: string;
  photos?: string[];
};

export const PhotoDialog = ({
  open,
  onOpenChange,
  item,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  onSuccess: () => void;
}) => {
  const [photos, setPhotos] = useState<string[]>(item.photos || []);
  const [isUploading, setIsUploading] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`Файл ${file.name} не является изображением`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Файл ${file.name} слишком большой (макс. 5MB)`);
          continue;
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${item.id}/${Date.now()}_${i}.${fileExt}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
          .from('item-photos')
          .upload(fileName, file);

        if (error) {
          console.error('Error uploading file:', error);
          if (error.message.includes('Bucket not found')) {
            toast.error('Ошибка: bucket "item-photos" не создан в Supabase Storage');
          } else {
            toast.error(`Ошибка загрузки ${file.name}: ${error.message}`);
          }
          continue;
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('item-photos')
          .getPublicUrl(data.path);

        uploadedUrls.push(publicUrlData.publicUrl);
      }

      if (uploadedUrls.length > 0) {
        // Update item with new photos
        const newPhotos = [...photos, ...uploadedUrls];

        const { error } = await supabase
          .from('items')
          .update({ photos: newPhotos })
          .eq('id', item.id);

        if (error) throw error;

        setPhotos(newPhotos);
        toast.success(`Загружено ${uploadedUrls.length} фото`);
        onSuccess();
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Ошибка загрузки фотографий');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async (photoUrl: string, index: number) => {
    if (!confirm('Удалить эту фотографию?')) return;

    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/item-photos/');
      if (urlParts.length !== 2) {
        throw new Error('Invalid photo URL');
      }
      const filePath = urlParts[1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('item-photos')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Update item photos array
      const newPhotos = photos.filter((_, i) => i !== index);

      const { error } = await supabase
        .from('items')
        .update({ photos: newPhotos })
        .eq('id', item.id);

      if (error) throw error;

      setPhotos(newPhotos);
      if (currentPhotoIndex >= newPhotos.length && newPhotos.length > 0) {
        setCurrentPhotoIndex(newPhotos.length - 1);
      }
      toast.success('Фотография удалена');
      onSuccess();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error('Ошибка удаления фотографии');
    }
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Фотографии: {item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo viewer */}
          {photos.length > 0 ? (
            <div className="relative">
              <img
                src={photos[currentPhotoIndex]}
                alt={`Фото ${currentPhotoIndex + 1}`}
                className="w-full h-auto max-h-[400px] object-contain rounded-lg bg-gray-100"
              />

              {/* Navigation buttons */}
              {photos.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2"
                    onClick={prevPhoto}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={nextPhoto}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {/* Delete button */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => handleDeletePhoto(photos[currentPhotoIndex], currentPhotoIndex)}
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Photo counter */}
              <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
                {currentPhotoIndex + 1} / {photos.length}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>Нет фотографий</p>
            </div>
          )}

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {photos.map((photo, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                    index === currentPhotoIndex ? 'border-primary' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Миниатюра ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Upload button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Загрузка...' : 'Загрузить фото'}
            </Button>
          </div>

          {/* Close button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
