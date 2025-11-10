import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, History } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { ItemCard } from "@/components/ItemCard";
import { AddItemDialog } from "@/components/AddItemDialog";

type Item = {
  id: string;
  name: string;
  category: string;
  warehouse: string;
  quantity: number;
  critical_quantity: number | null;
  notes: string | null;
};

const Inventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/");
        return;
      }

      // Check if user has telegram_id and is whitelisted
      const telegramId = session.user.user_metadata?.telegram_id;

      if (!telegramId) {
        // Old user without telegram_id - force logout
        toast.error("Доступ ограничен. Требуется вход через Telegram Mini App.");
        await supabase.auth.signOut();
        navigate("/");
        return;
      }

      // Check if user is still whitelisted
      const { data: isWhitelisted } = await supabase.rpc('is_telegram_user_whitelisted', {
        user_telegram_id: telegramId
      });

      if (!isWhitelisted) {
        toast.error("У вас больше нет доступа к этому приложению.");
        await supabase.auth.signOut();
        navigate("/");
        return;
      }

      // Get user's name from Telegram metadata
      const name = session.user.user_metadata?.name ||
                   session.user.user_metadata?.first_name ||
                   "Пользователь";
      setUserName(name);
      console.log("User name:", name);

      fetchWarehouses();
      fetchItems();
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      }
    });

    // Real-time subscriptions disabled due to errors
    // TODO: Re-enable after fixing Realtime configuration
    /*
    const itemsChannel = supabase
      .channel('database-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items'
        },
        (payload) => {
          console.log('Items change detected:', payload);
          fetchItems();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Transaction change detected:', payload);
          fetchItems();
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Error subscribing to real-time changes');
          toast.error('Ошибка подключения к real-time обновлениям');
        }
      });
    */

    return () => {
      subscription.unsubscribe();
      // supabase.removeChannel(itemsChannel); // Disabled with realtime
    };
  }, [navigate]);

  const fetchWarehouses = async () => {
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select("name")
        .order("name");

      if (error) throw error;

      setWarehouses(data?.map(w => w.name) || []);
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .order("name");

      if (error) throw error;

      setItems(data || []);

      // Extract unique categories
      const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Ошибка загрузки данных");
    }
  };

  useEffect(() => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.model && item.model.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedWarehouse !== "all") {
      filtered = filtered.filter(item => item.warehouse === selectedWarehouse);
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  }, [items, searchQuery, selectedWarehouse, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <img src={logo} alt="ЦЭПП Services" className="h-10" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{userName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/log")}
                title="Журнал событий"
              >
                <History className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        <div className="mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Инвентарь</h1>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить предмет
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger>
                <SelectValue placeholder="Все склады" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все склады</SelectItem>
                {warehouses.map(warehouse => (
                  <SelectItem key={warehouse} value={warehouse}>
                    {warehouse}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Все категории" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(item => (
            <ItemCard key={item.id} item={item} onUpdate={fetchItems} userName={userName} />
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Предметы не найдены
          </div>
        )}
      </main>

      <AddItemDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchItems}
      />
    </div>
  );
};

export default Inventory;