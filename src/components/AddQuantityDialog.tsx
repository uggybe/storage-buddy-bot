import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Item = {
  id: string;
  name: string;
  quantity: number;
  location: string | null;
};

export const AddQuantityDialog = ({
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
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState(item.location || "");
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  useEffect(() => {
    if (open) {
      setLocation(item.location || "");
      setIsEditingLocation(false);
      setQuantity(1);
    }
  }, [open, item.location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      toast.error("Количество должно быть больше 0");
      return;
    }

    setIsLoading(true);

    try {
      // Update item quantity and location
      const { error: updateError } = await supabase
        .from("items")
        .update({
          quantity: item.quantity + quantity,
          location: location.trim() || null
        })
        .eq("id", item.id);

      if (updateError) throw updateError;

      toast.success(`Добавлено ${quantity} шт.`);
      onSuccess();
      onOpenChange(false);
      setQuantity(1);
      setLocation("");
      setIsEditingLocation(false);
    } catch (error) {
      console.error("Error adding quantity:", error);
      toast.error("Ошибка при добавлении количества");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Пополнить: {item.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-quantity">Количество для добавления</Label>
            <Input
              id="add-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Текущее количество: {item.quantity}
            </p>
            <p className="text-xs text-muted-foreground">
              После добавления: {item.quantity + quantity}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Местоположение</Label>
              {!isEditingLocation && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingLocation(true)}
                  disabled={isLoading}
                >
                  Изменить
                </Button>
              )}
            </div>
            {isEditingLocation ? (
              <Input
                id="add-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isLoading}
                placeholder="Например: Полка 3, ряд 2"
                autoFocus
              />
            ) : (
              <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-sm">
                  {location || "Не указано"}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Добавление..." : "Добавить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
