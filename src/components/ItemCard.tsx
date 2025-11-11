import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, Edit, Trash2, Paperclip } from "lucide-react";
import { TakeItemDialog } from "./TakeItemDialog";
import { ReturnItemDialog } from "./ReturnItemDialog";
import { EditItemDialog } from "./EditItemDialog";
import { DeleteItemDialog } from "./DeleteItemDialog";
import { AddQuantityDialog } from "./AddQuantityDialog";
import { PhotoDialog } from "./PhotoDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Item = {
  id: string;
  name: string;
  model: string | null;
  category: string;
  warehouse: string;
  item_type: "единичный" | "множественный";
  quantity: number;
  critical_quantity: number | null;
  current_user_id: string | null;
  location: string | null;
  notes: string | null;
  photos?: string[];
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTakeDialogOpen, setIsTakeDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [categoryCriticalQuantity, setCategoryCriticalQuantity] = useState<number>(0);

  // Fetch category critical quantity
  useEffect(() => {
    const fetchCategoryCriticalQuantity = async () => {
      const { data } = await supabase
        .from("categories")
        .select("critical_quantity")
        .eq("name", item.category)
        .single();

      if (data) {
        setCategoryCriticalQuantity(data.critical_quantity);
      }
    };

    fetchCategoryCriticalQuantity();
  }, [item.category]);

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

      // If critical_quantity is 0, ignore yellow warning and only show red when out of stock
      if (categoryCriticalQuantity === 0) {
        return "border-green-500 border-2";
      }

      // Yellow if at or below critical quantity (but not zero)
      if (item.quantity <= categoryCriticalQuantity) {
        return "border-yellow-500 border-2";
      } else {
        // Green - sufficient
        return "border-green-500 border-2";
      }
    }
  };

  const isLowStock = item.item_type === "множественный" && categoryCriticalQuantity > 0 && item.quantity <= categoryCriticalQuantity && item.quantity > 0;

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
      <Card className={`${getBorderColor()} cursor-pointer transition-all`} onClick={() => setIsExpanded(!isExpanded)}>
        <CardHeader className="py-2 px-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base leading-tight truncate">{item.name}</CardTitle>
              {item.model && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">{item.model}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Количество или статус */}
              {item.item_type === "множественный" && (
                <span className="text-lg font-bold tabular-nums">
                  {item.quantity === 0 ? (
                    <span className="text-red-600">0 шт.</span>
                  ) : (
                    <span>{item.quantity} шт.</span>
                  )}
                </span>
              )}
              {item.item_type === "единичный" && item.current_user_id && currentUser && (
                <span className="text-lg font-medium text-yellow-700">
                  {item.current_user_id === currentUserId ? "Взят" : currentUser.name.split(' ')[0]}
                </span>
              )}
              {/* Кнопка редактирования */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditDialogOpen(true);
                }}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <>
            <CardContent className="space-y-1.5 py-2 px-3">
              {/* Info badges */}
              <div className="flex items-center gap-2 flex-wrap my-2.5">
                <Badge variant="secondary" className="text-xs px-2 py-0.5 h-5">{item.category}</Badge>
                <Badge variant="outline" className="text-xs px-2 py-0.5 h-5">{item.warehouse}</Badge>
              </div>

              {isLowStock && (
                <div className="flex items-center gap-1.5 text-yellow-600">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Мало!</span>
                </div>
              )}

              {item.notes && (
                <p className="text-xs text-muted-foreground">{item.notes}</p>
              )}

              {/* Show location only for multiple items OR single items that are not taken */}
              {item.location && (item.item_type === "множественный" || !item.current_user_id) && (
                <div className="p-1.5 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-xs">
                    <span className="font-medium">Место:</span> {item.location}
                  </p>
                </div>
              )}

              {purpose && item.item_type === "единичный" && (
                <div className="p-1.5 bg-blue-50 border border-blue-200 rounded">
                  <p className="text-xs">
                    <span className="font-medium">Назначение:</span> {purpose}
                  </p>
                </div>
              )}

              {item.item_type === "единичный" && currentUser && (
                <div className="p-1.5 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs">
                    <span className="font-medium">Использует:</span>{" "}
                    {item.current_user_id === currentUserId ? "Вы" : currentUser.name}
                  </p>
                </div>
              )}
            </CardContent>

            <CardFooter className="gap-2 py-2 px-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
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
                  {/* If taken by another user, show gray "ВЗЯТ" badge */}
                  {item.current_user_id && item.current_user_id !== currentUserId && (
                    <div className="flex-1 px-4 py-2 bg-gray-200 text-gray-500 text-center rounded-md cursor-not-allowed font-medium">
                      ВЗЯТ
                    </div>
                  )}
                  {/* Photo attachment button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 relative"
                    onClick={() => setIsPhotoDialogOpen(true)}
                    title="Фотографии предмета"
                  >
                    <Paperclip className="h-4 w-4" />
                    {item.photos && item.photos.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {item.photos.length}
                      </span>
                    )}
                  </Button>
                  {/* Delete button in expanded view */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                  {/* Photo attachment button */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 relative"
                    onClick={() => setIsPhotoDialogOpen(true)}
                    title="Фотографии предмета"
                  >
                    <Paperclip className="h-4 w-4" />
                    {item.photos && item.photos.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {item.photos.length}
                      </span>
                    )}
                  </Button>
                  {/* Delete button in expanded view */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </CardFooter>
          </>
        )}
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

      <PhotoDialog
        open={isPhotoDialogOpen}
        onOpenChange={setIsPhotoDialogOpen}
        item={item}
        onSuccess={onUpdate}
      />
    </>
  );
};