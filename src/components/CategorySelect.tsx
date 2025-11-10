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

type Category = {
  id: string;
  name: string;
  critical_quantity: number;
};

export const CategorySelect = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCriticalQuantity, setNewCriticalQuantity] = useState("0");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        toast.error(`Ошибка загрузки категорий: ${error.message}`);
        return;
      }

      console.log("Fetched categories:", data);
      if (data) {
        setCategories(data);
      }
    } catch (err) {
      console.error("Unexpected error fetching categories:", err);
    }
  };

  const handleSelect = (category: string) => {
    onChange(category);
    setOpen(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Введите название категории");
      return;
    }

    const criticalQty = parseInt(newCriticalQuantity) || 0;

    console.log("Creating category:", newCategoryName.trim(), criticalQty);

    const { error } = await supabase
      .from("categories")
      .insert({
        name: newCategoryName.trim(),
        critical_quantity: criticalQty,
      });

    if (error) {
      console.error("Category creation error:", error);
      toast.error(`Ошибка создания категории: ${error.message}`);
      return;
    }

    toast.success("Категория создана");
    onChange(newCategoryName.trim());
    setNewCategoryName("");
    setNewCriticalQuantity("0");
    setIsCreateDialogOpen(false);
    fetchCategories();
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    const criticalQty = parseInt(newCriticalQuantity) || 0;

    const { error } = await supabase
      .from("categories")
      .update({
        name: newCategoryName.trim(),
        critical_quantity: criticalQty,
      })
      .eq("id", editingCategory.id);

    if (error) {
      toast.error("Ошибка обновления категории");
      console.error(error);
      return;
    }

    toast.success("Категория обновлена");

    // Update selected value if it was changed
    if (value === editingCategory.name) {
      onChange(newCategoryName.trim());
    }

    setIsEditDialogOpen(false);
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCriticalQuantity("0");
    fetchCategories();
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Удалить категорию "${categoryName}"? Это не удалит предметы, но нужно будет переназначить категорию для существующих предметов.`)) {
      return;
    }

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId);

    if (error) {
      toast.error("Ошибка удаления категории");
      console.error(error);
      return;
    }

    toast.success("Категория удалена");
    fetchCategories();
  };

  const openCreateDialog = () => {
    setNewCategoryName("");
    setNewCriticalQuantity("0");
    setIsCreateDialogOpen(true);
    setOpen(false);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCriticalQuantity(category.critical_quantity.toString());
    setIsEditDialogOpen(true);
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
              {value || "Выберите категорию"}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(400px,90vw)] p-0" align="start" sideOffset={4}>
            <Command>
              <CommandInput placeholder="Поиск категории..." />
              <CommandList>
                <CommandEmpty>Категория не найдена.</CommandEmpty>
                <CommandGroup>
                  {categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={category.name}
                      onSelect={() => handleSelect(category.name)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === category.name ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div>{category.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Мин. количество: {category.critical_quantity === 0 ? "не установлено" : category.critical_quantity}
                        </div>
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
                  Новая категория
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
          title="Управление категориями"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Создать новую категорию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-category-name">Название категории *</Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Например: Инструменты"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-critical-quantity">Минимальное количество *</Label>
              <Input
                id="new-critical-quantity"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={newCriticalQuantity}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setNewCriticalQuantity(value || '0');
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Все множественные предметы этой категории будут иметь это минимальное количество. Укажите 0 для отключения предупреждения.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateCategory}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Categories Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Управление категориями</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Нет категорий
              </p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{category.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Мин. количество: {category.critical_quantity === 0 ? "не установлено" : category.critical_quantity}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(category)}
                      title="Редактировать"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCategory(category.id, category.name)}
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

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Редактировать категорию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">Название категории *</Label>
              <Input
                id="edit-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Например: Инструменты"
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-critical-quantity">Минимальное количество *</Label>
              <Input
                id="edit-critical-quantity"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={newCriticalQuantity}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  setNewCriticalQuantity(value || '0');
                }}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Все множественные предметы этой категории будут иметь это минимальное количество. Укажите 0 для отключения предупреждения.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleUpdateCategory}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
