import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

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

  const handleWarehouseToggle = (warehouse: string) => {
    if (selectedWarehouses.includes(warehouse)) {
      onWarehouseChange(selectedWarehouses.filter(w => w !== warehouse));
    } else {
      onWarehouseChange([...selectedWarehouses, warehouse]);
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const handleItemTypeToggle = (itemType: string) => {
    if (selectedItemTypes.includes(itemType)) {
      onItemTypeChange(selectedItemTypes.filter(t => t !== itemType));
    } else {
      onItemTypeChange([...selectedItemTypes, itemType]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Фильтры</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Склад</Label>
            <div className="space-y-2">
              {warehouses.map(warehouse => (
                <div key={warehouse} className="flex items-center space-x-2">
                  <Checkbox
                    id={`warehouse-${warehouse}`}
                    checked={selectedWarehouses.includes(warehouse)}
                    onCheckedChange={() => handleWarehouseToggle(warehouse)}
                  />
                  <label
                    htmlFor={`warehouse-${warehouse}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {warehouse}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Категория</Label>
            <div className="space-y-2">
              {categories.map(category => (
                <div key={category} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category}`}
                    checked={selectedCategories.includes(category)}
                    onCheckedChange={() => handleCategoryToggle(category)}
                  />
                  <label
                    htmlFor={`category-${category}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {category}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Тип предмета</Label>
            <div className="space-y-2">
              {["единичный", "множественный"].map(itemType => (
                <div key={itemType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${itemType}`}
                    checked={selectedItemTypes.includes(itemType)}
                    onCheckedChange={() => handleItemTypeToggle(itemType)}
                  />
                  <label
                    htmlFor={`type-${itemType}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
                  </label>
                </div>
              ))}
            </div>
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
