import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const DeleteItemDialog = ({
  open,
  onOpenChange,
  itemId,
  itemName,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  onSuccess: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);

    // Optimistic update - close dialog and update UI immediately
    onOpenChange(false);
    onSuccess();

    try {
      // Get authenticated user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      // Get user's app_users record and item details in parallel
      const [appUserResult, itemDataResult] = await Promise.all([
        supabase
          .from("app_users")
          .select("id")
          .eq("user_id", session.user.id)
          .single(),
        supabase
          .from("items")
          .select("*")
          .eq("id", itemId)
          .single()
      ]);

      const appUser = appUserResult.data;
      const itemData = itemDataResult.data;

      if (!appUser) throw new Error("User profile not found");

      // Log the action and delete item in parallel
      await Promise.all([
        supabase.from("transactions").insert({
          item_id: itemId,
          user_id: appUser.id,
          action: "удалено",
          quantity: itemData?.quantity || 0,
          item_name: itemName,
          category_name: itemData?.category,
          details: itemData ? {
            model: itemData.model,
            manufacturer: itemData.manufacturer,
            warehouse: itemData.warehouse,
            item_type: itemData.item_type,
            location: itemData.location,
          } : null,
        }),
        supabase
          .from("items")
          .delete()
          .eq("id", itemId)
      ]);

      toast.success("Предмет удален");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Ошибка удаления предмета. Обновите страницу.");
      // Re-fetch to restore correct state
      onSuccess();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Удалить предмет?</DialogTitle>
          <DialogDescription>
            Вы уверены, что хотите удалить "{itemName}"? Это действие нельзя отменить.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="flex-1"
            disabled={isLoading}
          >
            Отмена
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isLoading} 
            className="flex-1"
          >
            {isLoading ? "Удаление..." : "Удалить"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};