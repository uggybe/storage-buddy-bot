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

    try {
      const { error } = await supabase
        .from("items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Предмет удален");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Ошибка удаления предмета");
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