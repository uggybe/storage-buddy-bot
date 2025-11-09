import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Item = {
  id: string;
  name: string;
  category: string;
  warehouse: string;
  item_type: "единичный" | "множественный";
  quantity: number;
  critical_quantity: number | null;
  location: string | null;
  notes: string | null;
};

export const EditItemDialog = ({
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
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    warehouse: "",
    item_type: "множественный" as "единичный" | "множественный",
    quantity: 1,
    critical_quantity: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: item.name,
        category: item.category,
        warehouse: item.warehouse,
        item_type: item.item_type,
        quantity: item.quantity,
        critical_quantity: item.critical_quantity?.toString() || "",
        location: item.location || "",
        notes: item.notes || "",
      });
    }
  }, [open, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.category || !formData.warehouse) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("items")
        .update({
          name: formData.name,
          category: formData.category,
          warehouse: formData.warehouse as "Мастерская" | "Холодный" | "Теплый",
          item_type: formData.item_type,
          quantity: formData.item_type === "единичный" ? 1 : formData.quantity,
          critical_quantity: formData.item_type === "единичный" ? null : (formData.critical_quantity ? parseInt(formData.critical_quantity) : null),
          location: formData.location || null,
          notes: formData.notes || null,
        })
        .eq("id", item.id);

      if (error) throw error;

      toast.success("Предмет обновлен");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Ошибка обновления предмета");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать предмет</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Название *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Категория *</Label>
            <Input
              id="edit-category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-warehouse">Склад *</Label>
            <Select
              value={formData.warehouse}
              onValueChange={(value) => setFormData({ ...formData, warehouse: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Мастерская">Мастерская</SelectItem>
                <SelectItem value="Холодный">Холодный</SelectItem>
                <SelectItem value="Теплый">Теплый</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-item-type">Тип предмета *</Label>
            <Select
              value={formData.item_type}
              onValueChange={(value: "единичный" | "множественный") => setFormData({ ...formData, item_type: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="единичный">Единичный</SelectItem>
                <SelectItem value="множественный">Множественный</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.item_type === "множественный" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Количество</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-critical">Критическое количество</Label>
                <Input
                  id="edit-critical"
                  type="number"
                  min="0"
                  value={formData.critical_quantity}
                  onChange={(e) => setFormData({ ...formData, critical_quantity: e.target.value })}
                  disabled={isLoading}
                  placeholder="Необязательно"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-location">Местоположение</Label>
            <Input
              id="edit-location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              disabled={isLoading}
              placeholder="Например: Полка 3, ряд 2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Примечания</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Сохранение..." : "Сохранить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};