import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Item = {
  id: string;
  name: string;
  quantity: number;
};

export const TakeItemDialog = ({
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
  const [purpose, setPurpose] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!purpose.trim()) {
      toast.error("Укажите назначение");
      return;
    }

    if (quantity > item.quantity) {
      toast.error("Недостаточно предметов на складе");
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

      // Create transaction
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          item_id: item.id,
          user_id: user.id,
          action: "взято",
          quantity,
          purpose: purpose.trim(),
        });

      if (transactionError) throw transactionError;

      // Update item quantity
      const { error: updateError } = await supabase
        .from("items")
        .update({ quantity: item.quantity - quantity })
        .eq("id", item.id);

      if (updateError) throw updateError;

      toast.success("Предмет взят");
      onSuccess();
      onOpenChange(false);
      setQuantity(1);
      setPurpose("");
    } catch (error) {
      console.error("Error taking item:", error);
      toast.error("Ошибка при взятии предмета");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Взять: {item.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Количество</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={item.quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Доступно: {item.quantity}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Назначение *</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              disabled={isLoading}
              rows={3}
              placeholder="Для чего берете предмет?"
            />
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Отмена
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Сохранение..." : "Взять"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};