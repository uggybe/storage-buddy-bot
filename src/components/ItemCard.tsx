import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { TakeItemDialog } from "./TakeItemDialog";
import { ReturnItemDialog } from "./ReturnItemDialog";
import { EditItemDialog } from "./EditItemDialog";
import { DeleteItemDialog } from "./DeleteItemDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Item = {
  id: string;
  name: string;
  category: string;
  warehouse: string;
  item_type: "единичный" | "множественный";
  quantity: number;
  critical_quantity: number | null;
  current_user_id: string | null;
  notes: string | null;
};

type AppUser = {
  name: string;
};

type Transaction = {
  id: string;
  user_id: string;
  action: string;
  quantity: number;
  purpose: string | null;
  created_at: string;
  app_users: {
    name: string;
  };
};

export const ItemCard = ({
  item,
  onUpdate,
  userName
}: {
  item: Item;
  onUpdate: () => void;
  userName: string;
}) => {
  const [isTakeDialogOpen, setIsTakeDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // Calculate border color based on item type and status
  const getBorderColor = () => {
    if (item.item_type === "единичный") {
      // Green if not taken, Yellow if taken
      return item.current_user_id ? "border-yellow-500 border-2" : "border-green-500 border-2";
    } else {
      // Multiple item logic
      if (!item.critical_quantity) {
        // No critical quantity set, assume sufficient
        return "border-green-500 border-2";
      }

      if (item.quantity <= item.critical_quantity) {
        // Red - critically low
        return "border-red-500 border-2";
      } else if (item.quantity < item.critical_quantity * 1.5) {
        // Yellow - less than 50% above critical
        return "border-yellow-500 border-2";
      } else {
        // Green - sufficient
        return "border-green-500 border-2";
      }
    }
  };

  const isLowStock = item.item_type === "множественный" && item.critical_quantity && item.quantity <= item.critical_quantity;

  // Load current user on mount if item is taken
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (item.item_type === "единичный" && item.current_user_id) {
        try {
          const { data, error } = await supabase
            .from("app_users")
            .select("name")
            .eq("id", item.current_user_id)
            .single();

          if (error) throw error;
          setCurrentUser(data);
        } catch (error) {
          console.error("Error fetching current user:", error);
        }
      }
    };

    fetchCurrentUser();
  }, [item.current_user_id, item.item_type]);

  const handleTakeClick = () => {
    setIsTakeDialogOpen(true);
  };

  return (
    <>
      <Card className={getBorderColor()}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{item.name}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{item.category}</Badge>
                <Badge variant="outline">{item.warehouse}</Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {item.item_type === "множественный" && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Количество: <span className="font-semibold">{item.quantity}</span>
              </span>
            </div>
          )}

          {isLowStock && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Критически мало!</span>
            </div>
          )}

          {item.notes && (
            <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
          )}

          {item.item_type === "единичный" && currentUser && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Используется:</span> {currentUser.name}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="gap-2">
          <Button
            variant="default"
            className="flex-1"
            onClick={handleTakeClick}
            disabled={item.item_type === "множественный" && item.quantity === 0}
          >
            Взять
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setIsReturnDialogOpen(true)}
          >
            Вернуть
          </Button>
        </CardFooter>
      </Card>

      <TakeItemDialog
        open={isTakeDialogOpen}
        onOpenChange={setIsTakeDialogOpen}
        item={item}
        userName={userName}
        onSuccess={onUpdate}
      />

      <ReturnItemDialog
        open={isReturnDialogOpen}
        onOpenChange={setIsReturnDialogOpen}
        item={item}
        userName={userName}
        onSuccess={onUpdate}
      />

      <EditItemDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        item={item}
        onSuccess={onUpdate}
      />

      <DeleteItemDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        itemId={item.id}
        itemName={item.name}
        onSuccess={onUpdate}
      />
    </>
  );
};