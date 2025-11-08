import { useState } from "react";
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
  quantity: number;
  critical_quantity: number | null;
  notes: string | null;
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
  const [currentUser, setCurrentUser] = useState<Transaction | null>(null);

  const isLowStock = item.critical_quantity && item.quantity <= item.critical_quantity;

  const fetchCurrentUser = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          app_users (name)
        `)
        .eq("item_id", item.id)
        .eq("action", "взято")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setCurrentUser(data);
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const handleTakeClick = () => {
    fetchCurrentUser();
    setIsTakeDialogOpen(true);
  };

  return (
    <>
      <Card className={isLowStock ? "border-accent" : ""}>
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
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              Количество: <span className="font-semibold">{item.quantity}</span>
            </span>
          </div>

          {isLowStock && (
            <div className="flex items-center gap-2 text-accent">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Заканчивается!</span>
            </div>
          )}

          {item.notes && (
            <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
          )}

          {currentUser && (
            <div className="mt-3 p-2 bg-muted rounded-md">
              <p className="text-sm">
                <span className="font-medium">Взято:</span> {currentUser.app_users.name}
              </p>
              {currentUser.purpose && (
                <p className="text-xs text-muted-foreground mt-1">
                  {currentUser.purpose}
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="gap-2">
          <Button 
            variant="default" 
            className="flex-1"
            onClick={handleTakeClick}
            disabled={item.quantity === 0}
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