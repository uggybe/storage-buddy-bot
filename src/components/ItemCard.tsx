import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, Edit, Trash2 } from "lucide-react";
import { TakeItemDialog } from "./TakeItemDialog";
import { ReturnItemDialog } from "./ReturnItemDialog";
import { EditItemDialog } from "./EditItemDialog";
import { DeleteItemDialog } from "./DeleteItemDialog";
import { AddQuantityDialog } from "./AddQuantityDialog";
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
  location: string | null;
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<string | null>(null);

  // Calculate border color based on item type and status
  const getBorderColor = () => {
    if (item.item_type === "единичный") {
      // Green if not taken, Yellow if taken
      return item.current_user_id ? "border-yellow-500 border-2" : "border-green-500 border-2";
    } else {
      // Multiple item logic
      // Red if quantity is 0 (out of stock)
      if (item.quantity === 0) {
        return "border-red-500 border-2";
      }

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

  // Load current authenticated user and item's current user
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get current authenticated user's app_users id
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: appUser } = await supabase
            .from("app_users")
            .select("id")
            .eq("user_id", session.user.id)
            .single();

          if (appUser) {
            setCurrentUserId(appUser.id);
          }
        }

        // Fetch user who currently has the item (for single items)
        if (item.item_type === "единичный" && item.current_user_id) {
          const { data, error } = await supabase
            .from("app_users")
            .select("name")
            .eq("id", item.current_user_id)
            .single();

          if (error) throw error;
          setCurrentUser(data);

          // Fetch purpose from last "взято" transaction
          const { data: transaction } = await supabase
            .from("transactions")
            .select("purpose")
            .eq("item_id", item.id)
            .eq("user_id", item.current_user_id)
            .eq("action", "взято")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (transaction) {
            setPurpose(transaction.purpose);
          }
        } else {
          setCurrentUser(null);
          setPurpose(null);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [item.current_user_id, item.item_type, item.id]);

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
          {item.item_type === "множественный" && item.quantity === 0 && (
            <div className="flex items-center gap-2 text-red-600">
              <span className="text-lg font-bold">Закончился 😢</span>
            </div>
          )}

          {item.item_type === "множественный" && item.quantity > 0 && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Количество: <span className="font-semibold">{item.quantity}</span>
              </span>
            </div>
          )}

          {isLowStock && item.quantity > 0 && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Критически мало!</span>
            </div>
          )}

          {item.notes && (
            <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
          )}

          {/* Show location only for multiple items OR single items that are not taken */}
          {item.location && (item.item_type === "множественный" || !item.current_user_id) && (
            <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Местоположение:</span> {item.location}
              </p>
            </div>
          )}

          {purpose && item.item_type === "единичный" && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Назначение:</span> {purpose}
              </p>
            </div>
          )}

          {item.item_type === "единичный" && currentUser && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Используется:</span>{" "}
                {item.current_user_id === currentUserId ? "Вами" : currentUser.name}
              </p>
            </div>
          )}
        </CardContent>

        <CardFooter className="gap-2">
          {/* For single items: show buttons based on current_user_id */}
          {item.item_type === "единичный" ? (
            <>
              {/* If not taken, show Take button */}
              {!item.current_user_id && (
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleTakeClick}
                >
                  Взять
                </Button>
              )}
              {/* If taken by current user, show Return button */}
              {item.current_user_id === currentUserId && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsReturnDialogOpen(true)}
                >
                  Вернуть
                </Button>
              )}
              {/* If taken by someone else, hide both buttons */}
            </>
          ) : (
            /* For multiple items: show Take and Add buttons (no Return) */
            <>
              {item.quantity > 0 && (
                <Button
                  variant="default"
                  className="flex-1"
                  onClick={handleTakeClick}
                >
                  Взять
                </Button>
              )}
              <Button
                variant="default"
                className="flex-1"
                onClick={() => setIsAddDialogOpen(true)}
              >
                Добавить
              </Button>
            </>
          )}
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

      <AddQuantityDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        item={item}
        onSuccess={onUpdate}
      />
    </>
  );
};