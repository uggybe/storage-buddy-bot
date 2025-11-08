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
  quantity: number;
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
  const [locationDetails, setLocationDetails] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationDetails.trim()) {
      toast.error("Укажите где именно на складе размещен предмет");
      return;
    }

    setIsLoading(true);

    try {
      // Get user ID
      const { data: user } = await supabase
        .from("app_users")
        .select("id")
        .eq("name", userName)
        .single();

      if (!user) throw new Error("User not found");

      // Create return transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          item_id: item.id,
          user_id: user.id,
          action: "возвращено",
          quantity,
          warehouse_returned: warehouse as "Мастерская" | "Холодный" | "Теплый",
          location_details: locationDetails.trim(),
        });

      if (transactionError) throw transactionError;

      // Update item quantity and warehouse if changed
      const { error: updateError } = await supabase
        .from("items")
        .update({ 
          quantity: item.quantity + quantity,
          warehouse: warehouse as "Мастерская" | "Холодный" | "Теплый"
        })
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Вернуть: {item.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="return-quantity">Количество</Label>
            <Input
              id="return-quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              disabled={isLoading}
            />
          </div>

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
            <Label htmlFor="location">Где на складе размещено *</Label>
            <Textarea
              id="location"
              value={locationDetails}
              onChange={(e) => setLocationDetails(e.target.value)}
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