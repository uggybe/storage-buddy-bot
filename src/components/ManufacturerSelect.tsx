import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface ManufacturerSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const ManufacturerSelect = ({ value, onChange, disabled }: ManufacturerSelectProps) => {
  const [manufacturers, setManufacturers] = useState<string[]>([]);

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    const { data, error } = await supabase
      .from("manufacturers")
      .select("name")
      .order("name");

    if (error) {
      console.error("Error fetching manufacturers:", error);
      return;
    }

    setManufacturers(data?.map(m => m.name) || []);
  };

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Выберите производителя" />
      </SelectTrigger>
      <SelectContent>
        {manufacturers.map((manufacturer) => (
          <SelectItem key={manufacturer} value={manufacturer}>
            {manufacturer}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
