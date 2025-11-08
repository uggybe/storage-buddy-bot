import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    category: "",
    warehouse: "",
    item_type: "множественный" as "единичный" | "множественный",
    quantity: 1,
    critical_quantity: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.warehouse) {
      toast.error("Заполните все обязательные поля");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.from("items").insert({
        name: formData.name,
        category: formData.category,
        warehouse: formData.warehouse as "Мастерская" | "Холодный" | "Теплый",
        item_type: formData.item_type,
        quantity: formData.item_type === "единичный" ? 1 : formData.quantity,
        critical_quantity: formData.item_type === "единичный" ? null : (formData.critical_quantity ? parseInt(formData.critical_quantity) : null),
        notes: formData.notes || null,
      });

      if (error) throw error;

      toast.success("Предмет добавлен");
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "",
        category: "",
        warehouse: "",
        item_type: "множественный",
        quantity: 1,
        critical_quantity: "",
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
      <DialogContent className="max-w-md">
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Категория *</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
            <>
              <div className="space-y-2">
                <Label htmlFor="quantity">Количество</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="critical">Критическое количество</Label>
                <Input
                  id="critical"
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
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
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
              {isLoading ? "Сохранение..." : "Добавить"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};