import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CategorySelect } from "./CategorySelect";

type Item = {
  id: string;
  name: string;
  model: string | null;
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
    model: "",
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
        model: item.model || "",
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

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Scroll to input after keyboard appears
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // All fields except notes are required
    if (!formData.name || !formData.model || !formData.category || !formData.warehouse || !formData.location) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setIsLoading(true);

    try {
      // Get authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      // Get user's app_users record
      const { data: appUser } = await supabase
        .from("app_users")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!appUser) throw new Error("User profile not found");

      // Update item
      const { error } = await supabase
        .from("items")
        .update({
          name: formData.name,
          model: formData.model,
          category: formData.category,
          warehouse: formData.warehouse as "Мастерская" | "Холодный" | "Теплый",
          item_type: formData.item_type,
          quantity: formData.item_type === "единичный" ? 1 : formData.quantity,
          location: formData.location,
          notes: formData.notes || null,
        })
        .eq("id", item.id);

      if (error) throw error;

      // Log the action
      await supabase.from("transactions").insert({
        item_id: item.id,
        user_id: appUser.id,
        action: "изменено",
        quantity: formData.item_type === "единичный" ? 1 : formData.quantity,
        item_name: formData.name,
        category_name: formData.category,
        details: {
          model: formData.model,
          warehouse: formData.warehouse,
          item_type: formData.item_type,
          location: formData.location,
        },
      });

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
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
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
              onFocus={handleInputFocus}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-model">Модель *</Label>
            <Input
              id="edit-model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              onFocus={handleInputFocus}
              disabled={isLoading}
              placeholder="Например: iPhone 13 Pro"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Категория *</Label>
            <CategorySelect
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
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
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Количество</Label>
              <Input
                id="edit-quantity"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.quantity}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, quantity: parseInt(value) || 0 });
                }}
                onFocus={handleInputFocus}
                disabled={isLoading}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Минимальное количество настраивается в категории
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-location">Местоположение *</Label>
            <Input
              id="edit-location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              onFocus={handleInputFocus}
              disabled={isLoading}
              placeholder="Например: Полка 3, ряд 2"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-notes">Примечания</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              onFocus={handleInputFocus}
              disabled={isLoading}
              rows={3}
              className="w-full"
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