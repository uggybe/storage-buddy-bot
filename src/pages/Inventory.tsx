import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, BookOpen, ArrowUp, ArrowDown, Filter } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { ItemCard } from "@/components/ItemCard";
import { AddItemDialog } from "@/components/AddItemDialog";
import { FilterDialog } from "@/components/FilterDialog";

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
  const [selectedItemType, setSelectedItemType] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [userFirstName, setUserFirstName] = useState("");
  const [userLastName, setUserLastName] = useState("");

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

      // Get user's name from whitelist table
      const { data: whitelistData } = await supabase
        .from('whitelist')
        .select('name')
        .eq('telegram_id', telegramId)
        .single();

      const fullName = whitelistData?.name || '';

      if (fullName) {
        // Split name by space: first word = last name, rest = first name
        const nameParts = fullName.split(' ');
        if (nameParts.length > 1) {
          setUserLastName(nameParts[0]);
          setUserFirstName(nameParts.slice(1).join(' '));
        } else {
          setUserFirstName(fullName);
          setUserLastName('');
        }
      } else {
        setUserFirstName('');
        setUserLastName('');
      }

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

    if (selectedItemType !== "all") {
      filtered = filtered.filter(item => item.item_type === selectedItemType);
    }

    // Apply sorting
    if (sortOrder) {
      filtered = [...filtered].sort((a, b) => {
        const aQty = a.quantity;
        const bQty = b.quantity;
        return sortOrder === "asc" ? aQty - bQty : bQty - aQty;
      });
    }

    setFilteredItems(filtered);
  }, [items, searchQuery, selectedWarehouse, selectedCategory, selectedItemType, sortOrder]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-1">
          <div className="flex items-center justify-between gap-2">
            <img src={logo} alt="ЦЭПП Services" className="h-10" />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className="flex flex-col items-end text-xs text-muted-foreground leading-tight">
                {userLastName && <span className="truncate max-w-[120px]">{userLastName}</span>}
                {userFirstName && <span className="truncate max-w-[120px]">{userFirstName}</span>}
                {!userLastName && !userFirstName && <span className="truncate max-w-[120px]">Пользователь</span>}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/log")}
                title="Журнал событий"
                className="flex-shrink-0 h-8 w-8 p-0"
              >
                <BookOpen className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4">
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Инвентарь</h1>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Добавить предмет
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button
              variant="default"
              onClick={() => setIsFilterDialogOpen(true)}
              className="w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
              {(() => {
                const activeFiltersCount =
                  (selectedWarehouse !== "all" ? 1 : 0) +
                  (selectedCategory !== "all" ? 1 : 0) +
                  (selectedItemType !== "all" ? 1 : 0);

                return activeFiltersCount > 0 ? (
                  <span className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
                    {activeFiltersCount}
                  </span>
                ) : null;
              })()}
            </Button>

            <div className="flex gap-2">
              <Button
                variant={sortOrder === "asc" ? "default" : "outline"}
                className="flex-1 text-sm px-2"
                onClick={() => setSortOrder(sortOrder === "asc" ? null : "asc")}
                title="По возрастанию количества"
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                <span className="whitespace-nowrap">Возрастание</span>
              </Button>
              <Button
                variant={sortOrder === "desc" ? "default" : "outline"}
                className="flex-1 text-sm px-2"
                onClick={() => setSortOrder(sortOrder === "desc" ? null : "desc")}
                title="По убыванию количества"
              >
                <ArrowDown className="h-4 w-4 mr-1" />
                <span className="whitespace-nowrap">Убывание</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map(item => (
            <ItemCard key={item.id} item={item} onUpdate={fetchItems} userName={`${userFirstName} ${userLastName}`.trim() || "Пользователь"} />
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

      <FilterDialog
        open={isFilterDialogOpen}
        onOpenChange={setIsFilterDialogOpen}
        warehouses={warehouses}
        categories={categories}
        selectedWarehouse={selectedWarehouse}
        selectedCategory={selectedCategory}
        selectedItemType={selectedItemType}
        onWarehouseChange={setSelectedWarehouse}
        onCategoryChange={setSelectedCategory}
        onItemTypeChange={setSelectedItemType}
        onReset={() => {
          setSelectedWarehouse("all");
          setSelectedCategory("all");
          setSelectedItemType("all");
        }}
      />
    </div>
  );
};

export default Inventory;