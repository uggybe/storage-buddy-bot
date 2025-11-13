import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const FilterDialog = ({
  open,
  onOpenChange,
  warehouses,
  categories,
  selectedWarehouse,
  selectedCategory,
  selectedItemType,
  onWarehouseChange,
  onCategoryChange,
  onItemTypeChange,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouses: string[];
  categories: string[];
  selectedWarehouse: string;
  selectedCategory: string;
  selectedItemType: string;
  onWarehouseChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onItemTypeChange: (value: string) => void;
  onReset: () => void;
}) => {
  const hasActiveFilters = selectedWarehouse || selectedCategory || selectedItemType;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Фильтры</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Склад</Label>
            <Select value={selectedWarehouse} onValueChange={onWarehouseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Все склады" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map(warehouse => (
                  <SelectItem key={warehouse} value={warehouse}>
                    {warehouse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Категория</Label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Тип предмета</Label>
            <Select value={selectedItemType} onValueChange={onItemTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Все типы" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="единичный">Единичный</SelectItem>
                <SelectItem value="множественный">Множественный</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                onClick={onReset}
                className="flex-1"
              >
                Сбросить
              </Button>
            )}
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Применить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
