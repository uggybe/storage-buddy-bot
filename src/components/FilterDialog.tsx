import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/ui/multi-select";

export const FilterDialog = ({
  open,
  onOpenChange,
  warehouses,
  categories,
  selectedWarehouses,
  selectedCategories,
  selectedItemTypes,
  onWarehouseChange,
  onCategoryChange,
  onItemTypeChange,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouses: string[];
  categories: string[];
  selectedWarehouses: string[];
  selectedCategories: string[];
  selectedItemTypes: string[];
  onWarehouseChange: (value: string[]) => void;
  onCategoryChange: (value: string[]) => void;
  onItemTypeChange: (value: string[]) => void;
  onReset: () => void;
}) => {
  const hasActiveFilters = selectedWarehouses.length > 0 || selectedCategories.length > 0 || selectedItemTypes.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Фильтры</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Склад</Label>
            <MultiSelect
              options={warehouses}
              selected={selectedWarehouses}
              onChange={onWarehouseChange}
              placeholder="Все склады"
            />
          </div>

          <div className="space-y-2">
            <Label>Категория</Label>
            <MultiSelect
              options={categories}
              selected={selectedCategories}
              onChange={onCategoryChange}
              placeholder="Все категории"
            />
          </div>

          <div className="space-y-2">
            <Label>Тип предмета</Label>
            <MultiSelect
              options={["единичный", "множественный"]}
              selected={selectedItemTypes}
              onChange={onItemTypeChange}
              placeholder="Все типы"
            />
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
