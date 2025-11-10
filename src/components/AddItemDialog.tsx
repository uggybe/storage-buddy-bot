import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CategorySelect } from "./CategorySelect";

export const AddItemDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // All fields except notes are required
    if (!formData.name || !formData.model || !formData.category || !formData.warehouse || !formData.location) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("items").insert({
        name: formData.name,
        model: formData.model,
        category: formData.category,
        warehouse: formData.warehouse as "Мастерская" | "Холодный" | "Теплый",
        item_type: formData.item_type,
        quantity: formData.item_type === "единичный" ? 1 : formData.quantity,
        location: formData.location,
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast.success("Предмет добавлен");
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "",
        model: "",
        category: "",
        warehouse: "",
        item_type: "множественный",
        quantity: 1,
        critical_quantity: "",
        location: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error adding item:", error);
      toast.error("Ошибка добавления предмета");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[75vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить предмет</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Модель *</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
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
            <Label htmlFor="warehouse">Склад *</Label>
            <Select
              value={formData.warehouse}
              onValueChange={(value) => setFormData({ ...formData, warehouse: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите склад" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Мастерская">Мастерская</SelectItem>
                <SelectItem value="Холодный">Холодный склад</SelectItem>
                <SelectItem value="Теплый">Теплый склад</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item_type">Тип предмета *</Label>
            <Select
              value={formData.item_type}
              onValueChange={(value: "единичный" | "множественный") => setFormData({ ...formData, item_type: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="единичный">Единичный</SelectItem>
                <SelectItem value="множественный">Множественный</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.item_type === "множественный" && (
            <div className="space-y-2">
              <Label htmlFor="quantity">Количество</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                disabled={isLoading}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Минимальное количество настраивается в категории
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location">Местоположение *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              disabled={isLoading}
              placeholder="Например: Полка 3, ряд 2"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
              {isLoading ? "Сохранение..." : "Добавить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};