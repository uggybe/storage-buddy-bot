import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Plus, Settings, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [open, setOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [newWarehouseName, setNewWarehouseName] = useState("");

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
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching warehouses:", error);
        toast.error(`Ошибка загрузки складов: ${error.message}`);
        return;
      }

      if (data) {
        setWarehouses(data);
      }
    } catch (err) {
      console.error("Unexpected error fetching warehouses:", err);
    }
  };

  const handleSelect = (warehouse: string) => {
    onChange(warehouse);
    setOpen(false);
  };

  const handleCreateWarehouse = async () => {
    if (!newWarehouseName.trim()) {
      toast.error("Введите название склада");
      return;
    }

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

      const { error } = await supabase
        .from("warehouses")
        .insert({
          name: newWarehouseName.trim(),
        });

      if (error) {
        console.error("Warehouse creation error:", error);
        toast.error(`Ошибка создания склада: ${error.message}`);
        return;
      }

      // Log the action
      await supabase.from("transactions").insert({
        user_id: appUser.id,
        action: "склад создан",
        quantity: 0,
        item_name: newWarehouseName.trim(),
        details: {
          warehouse_name: newWarehouseName.trim(),
        },
      });

      toast.success("Склад создан");
      onChange(newWarehouseName.trim());
      setNewWarehouseName("");
      setIsCreateDialogOpen(false);
      fetchWarehouses();
    } catch (error) {
      console.error("Error creating warehouse:", error);
      toast.error("Ошибка создания склада");
    }
  };

  const handleUpdateWarehouse = async () => {
    if (!editingWarehouse) return;

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

      const { error } = await supabase
        .from("warehouses")
        .update({
          name: newWarehouseName.trim(),
        })
        .eq("id", editingWarehouse.id);

      if (error) {
        toast.error("Ошибка обновления склада");
        console.error(error);
        return;
      }

      // Log the action
      await supabase.from("transactions").insert({
        user_id: appUser.id,
        action: "склад изменен",
        quantity: 0,
        item_name: newWarehouseName.trim(),
        details: {
          old_name: editingWarehouse.name,
          new_name: newWarehouseName.trim(),
        },
      });

      toast.success("Склад обновлен");

      // Update selected value if it was changed
      if (value === editingWarehouse.name) {
        onChange(newWarehouseName.trim());
      }

      setIsEditDialogOpen(false);
      setEditingWarehouse(null);
      setNewWarehouseName("");
      fetchWarehouses();
    } catch (error) {
      console.error("Error updating warehouse:", error);
      toast.error("Ошибка обновления склада");
    }
  };

  const handleDeleteWarehouse = async (warehouseId: string, warehouseName: string) => {
    if (!confirm(`Удалить склад "${warehouseName}"? Это не удалит предметы, но нужно будет переназначить склад для существующих предметов.`)) {
      return;
    }

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

      // Log the action before deletion
      await supabase.from("transactions").insert({
        user_id: appUser.id,
        action: "склад удален",
        quantity: 0,
        item_name: warehouseName,
        details: {
          warehouse_name: warehouseName,
        },
      });

      const { error } = await supabase
        .from("warehouses")
        .delete()
        .eq("id", warehouseId);

      if (error) {
        toast.error("Ошибка удаления склада");
        console.error(error);
        return;
      }

      toast.success("Склад удален");
      fetchWarehouses();
    } catch (error) {
      console.error("Error deleting warehouse:", error);
      toast.error("Ошибка удаления склада");
    }
  };

  const openCreateDialog = () => {
    setNewWarehouseName("");
    setIsCreateDialogOpen(true);
    setOpen(false);
  };

  const openEditDialog = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setNewWarehouseName(warehouse.name);
    setIsEditDialogOpen(true);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Scroll to input after keyboard appears
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  return (
    <>
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen} modal={true}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="flex-1 justify-between"
              disabled={disabled}
            >
              {value || "Выберите склад"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(400px,90vw)] p-0" align="start" sideOffset={4} onOpenAutoFocus={(e) => e.preventDefault()}>
            <Command>
              <CommandInput placeholder="Поиск склада..." />
              <CommandList>
                <CommandEmpty>Склад не найден.</CommandEmpty>
                <CommandGroup>
                  {warehouses.map((warehouse) => (
                    <CommandItem
                      key={warehouse.id}
                      value={warehouse.name}
                      onSelect={() => handleSelect(warehouse.name)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === warehouse.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div>{warehouse.name}</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
              <div className="border-t p-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={openCreateDialog}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Новый склад
                </Button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setIsManageDialogOpen(true)}
          disabled={disabled}
          title="Управление складами"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Create Warehouse Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Создать новый склад</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-warehouse-name">Название склада *</Label>
              <Input
                id="new-warehouse-name"
                value={newWarehouseName}
                onChange={(e) => setNewWarehouseName(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="Например: Холодный склад"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateWarehouse}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Warehouses Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Управление складами</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
            {warehouses.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Нет складов
              </p>
            ) : (
              warehouses.map((warehouse) => (
                <div
                  key={warehouse.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{warehouse.name}</div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(warehouse)}
                      title="Редактировать"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteWarehouse(warehouse.id, warehouse.name)}
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Warehouse Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-sm" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Редактировать склад</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-warehouse-name">Название склада *</Label>
              <Input
                id="edit-warehouse-name"
                value={newWarehouseName}
                onChange={(e) => setNewWarehouseName(e.target.value)}
                onFocus={handleInputFocus}
                placeholder="Например: Холодный склад"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateWarehouse}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
