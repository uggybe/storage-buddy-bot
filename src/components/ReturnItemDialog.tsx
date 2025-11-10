import { useState } from "react";
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
  warehouse: string;
  item_type: "единичный" | "множественный";
  quantity: number;
  location: string | null;
};

export const ReturnItemDialog = ({
  open,
  onOpenChange,
  item,
  userName,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  userName: string;
  onSuccess: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [warehouse, setWarehouse] = useState(item.warehouse);
  const [locationDetails, setLocationDetails] = useState(item.location || "");

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Scroll to input after keyboard appears
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationDetails.trim()) {
      toast.error("Укажите местоположение предмета на складе");
      return;
    }

    const actualQuantity = item.item_type === "единичный" ? 1 : quantity;

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

      // Create return transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          item_id: item.id,
          user_id: appUser.id,
          action: "возвращено",
          quantity: actualQuantity,
          warehouse_returned: warehouse as "Мастерская" | "Холодный" | "Теплый",
          location_details: locationDetails.trim(),
        });

      if (transactionError) throw transactionError;

      // Update item quantity, warehouse and location
      const updateData: any = {
        warehouse: warehouse as "Мастерская" | "Холодный" | "Теплый",
        location: locationDetails.trim()
      };

      // Only update quantity for multiple items
      if (item.item_type === "множественный") {
        updateData.quantity = item.quantity + actualQuantity;
      }

      const { error: updateError } = await supabase
        .from("items")
        .update(updateData)
        .eq("id", item.id);

      if (updateError) throw updateError;

      toast.success("Предмет возвращен");
      onSuccess();
      onOpenChange(false);
      setQuantity(1);
      setWarehouse(item.warehouse);
      setLocationDetails("");
    } catch (error) {
      console.error("Error returning item:", error);
      toast.error("Ошибка при возврате предмета");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Вернуть: {item.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {item.item_type === "множественный" && (
            <div className="space-y-2">
              <Label htmlFor="return-quantity">Количество</Label>
              <Input
                id="return-quantity"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setQuantity(parseInt(value) || 1);
                }}
                onFocus={handleInputFocus}
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="return-warehouse">Склад *</Label>
            <Select
              value={warehouse}
              onValueChange={setWarehouse}
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
            <Label htmlFor="location">Местоположение *</Label>
            <Textarea
              id="location"
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
              onFocus={handleInputFocus}
              disabled={isLoading}
              rows={3}
              placeholder="Укажите точное местоположение на складе"
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Сохранение..." : "Вернуть"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};