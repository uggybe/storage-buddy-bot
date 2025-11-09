import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

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
  const [categories, setCategories] = useState<string[]>([]);
  const [customValue, setCustomValue] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from("items")
        .select("category")
        .order("category");

      if (data) {
        const unique = [...new Set(data.map(item => item.category))];
        setCategories(unique);
      }
    };

    fetchCategories();
  }, []);

  const handleSelect = (category: string) => {
    onChange(category);
    setOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (customValue.trim()) {
      onChange(customValue.trim());
      setShowCustomInput(false);
      setCustomValue("");
      setOpen(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
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
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Поиск категории..." />
            <CommandList>
              <CommandEmpty>Категория не найдена.</CommandEmpty>
              <CommandGroup>
                {categories.map((category) => (
                  <CommandItem
                    key={category}
                    value={category}
                    onSelect={() => handleSelect(category)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === category ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {category}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {!showCustomInput ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCustomInput(true)}
          disabled={disabled}
        >
          Новая
        </Button>
      ) : (
        <div className="flex gap-1 flex-1">
          <Input
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            placeholder="Введите новую категорию"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomSubmit();
              }
            }}
            disabled={disabled}
          />
          <Button
            type="button"
            onClick={handleCustomSubmit}
            disabled={disabled}
          >
            OK
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setShowCustomInput(false);
              setCustomValue("");
            }}
            disabled={disabled}
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  );
};
