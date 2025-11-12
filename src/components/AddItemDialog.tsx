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
import { WarehouseSelect } from "./WarehouseSelect";

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
  const [validationError, setValidationError] = useState("");
  const [existingNames, setExistingNames] = useState<string[]>([]);
  const [existingModels, setExistingModels] = useState<string[]>([]);
  const [existingManufacturers, setExistingManufacturers] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    manufacturer: "",
    model: "",
    category: "",
    warehouse: "",
    item_type: "множественный" as "единичный" | "множественный",
    quantity: "1",
    critical_quantity: "",
    location: "",
    notes: "",
  });

  // Загрузка существующих названий, моделей и производителей
  useEffect(() => {
    if (open) {
      setValidationError("");
      const fetchSuggestions = async () => {
        try {
          const { data: items } = await supabase
            .from("items")
            .select("name, model, manufacturer")
            .order("name");

          if (items) {
            const names = [...new Set(items.map(item => item.name))];
            const models = [...new Set(items.map(item => item.model).filter(Boolean))];
            const manufacturers = [...new Set(items.map(item => item.manufacturer).filter(Boolean))];
            setExistingNames(names);
            setExistingModels(models);
            setExistingManufacturers(manufacturers);
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        }
      };
      fetchSuggestions();
    }
  }, [open]);

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Scroll to input after keyboard appears
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // All fields except notes are required
    if (!formData.name || !formData.manufacturer || !formData.model || !formData.category || !formData.warehouse || !formData.location) {
      setValidationError("Заполните все обязательные поля");
      return;
    }

    setValidationError("");

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

      const numQuantity = parseInt(formData.quantity) || 1;

      // Insert item
      const { data: newItem, error } = await supabase.from("items").insert({
        name: formData.name,
        manufacturer: formData.manufacturer,
        model: formData.model,
        category: formData.category,
        warehouse: formData.warehouse as "Мастерская" | "Холодный" | "Теплый",
        item_type: formData.item_type,
        quantity: formData.item_type === "единичный" ? 1 : numQuantity,
        location: formData.location,
        notes: formData.notes || null,
      }).select().single();

      if (error) throw error;

      // Log the action
      await supabase.from("transactions").insert({
        item_id: newItem.id,
        user_id: appUser.id,
        action: "создано",
        quantity: formData.item_type === "единичный" ? 1 : numQuantity,
        item_name: formData.name,
        category_name: formData.category,
        details: {
          manufacturer: formData.manufacturer,
          model: formData.model,
          warehouse: formData.warehouse,
          item_type: formData.item_type,
          location: formData.location,
        },
      });

      toast.success("Предмет добавлен");
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: "",
        manufacturer: "",
        model: "",
        category: "",
        warehouse: "",
        item_type: "множественный",
        quantity: "1",
        critical_quantity: "",
        location: "",
        notes: "",
      });
    } catch (error) {
      console.error("Error adding item:", error);
      setValidationError("Ошибка добавления предмета");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Добавить предмет</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Название *</Label>
            <Input
              id="name"
              list="names-list"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              onFocus={handleInputFocus}
              disabled={isLoading}
              className="w-full"
              autoComplete="off"
            />
            <datalist id="names-list">
              {existingNames.map((name, index) => (
                <option key={index} value={name} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="manufacturer">Производитель *</Label>
            <Input
              id="manufacturer"
              list="manufacturers-list"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              onFocus={handleInputFocus}
              disabled={isLoading}
              placeholder="Например: Apple"
              className="w-full"
              autoComplete="off"
            />
            <datalist id="manufacturers-list">
              {existingManufacturers.map((manufacturer, index) => (
                <option key={index} value={manufacturer} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="model">Модель *</Label>
            <Input
              id="model"
              list="models-list"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              onFocus={handleInputFocus}
              disabled={isLoading}
              placeholder="Например: iPhone 13 Pro"
              className="w-full"
              autoComplete="off"
            />
            <datalist id="models-list">
              {existingModels.map((model, index) => (
                <option key={index} value={model} />
              ))}
            </datalist>
          </div>

          <div className="space-y-1.5">
            <Label>Категория *</Label>
            <CategorySelect
              value={formData.category}
              onChange={(value) => setFormData({ ...formData, category: value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Склад *</Label>
            <WarehouseSelect
              value={formData.warehouse}
              onChange={(value) => setFormData({ ...formData, warehouse: value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Количество</Label>
              <Input
                id="quantity"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.quantity}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setFormData({ ...formData, quantity: value });
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

          <div className="space-y-1.5">
            <Label htmlFor="location">Местоположение *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              onFocus={handleInputFocus}
              disabled={isLoading}
              placeholder="Например: Полка 3, ряд 2"
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Примечания</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              onFocus={handleInputFocus}
              disabled={isLoading}
              rows={3}
              className="w-full"
            />
          </div>

          {validationError && (
            <div className="text-red-600 text-xs text-center">
              {validationError}
            </div>
          )}

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