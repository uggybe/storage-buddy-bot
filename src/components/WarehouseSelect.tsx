import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Warehouse = {
  id: string;
  name: string;
};

export const WarehouseSelect = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWarehouseName, setNewWarehouseName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchWarehouses();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('warehouses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'warehouses' }, () => {
        fetchWarehouses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWarehouses = async () => {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching warehouses:', error);
      return;
    }

    setWarehouses(data || []);
  };

  const handleCreate = async () => {
    if (!newWarehouseName.trim()) {
      toast.error("Введите название склада");
      return;
    }

    setIsCreating(true);

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

      // Create warehouse
      const { error } = await supabase
        .from('warehouses')
        .insert({ name: newWarehouseName.trim() });

      if (error) throw error;

      // Log the action
      await supabase.from("transactions").insert({
        user_id: appUser.id,
        action: "склад создан",
        quantity: 1,
        item_name: newWarehouseName.trim(),
        details: {
          warehouse_name: newWarehouseName.trim(),
        },
      });

      toast.success("Склад создан");
      setNewWarehouseName("");
      setIsDialogOpen(false);
      fetchWarehouses();
    } catch (error: any) {
      console.error('Error creating warehouse:', error);
      toast.error(error.message || "Ошибка создания склада");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Выберите склад" />
        </SelectTrigger>
        <SelectContent>
          {warehouses.map((warehouse) => (
            <SelectItem key={warehouse.id} value={warehouse.name}>
              {warehouse.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="icon" disabled={disabled}>
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Новый склад</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse-name">Название склада</Label>
              <Input
                id="warehouse-name"
                value={newWarehouseName}
                onChange={(e) => setNewWarehouseName(e.target.value)}
                placeholder="Например: Новый склад"
                disabled={isCreating}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
                disabled={isCreating}
              >
                Отмена
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                className="flex-1"
                disabled={isCreating}
              >
                {isCreating ? "Создание..." : "Создать"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
