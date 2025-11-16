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
  manufacturer: string;
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
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userFirstName, setUserFirstName] = useState(() => sessionStorage.getItem('userFirstName') || "");
  const [userLastName, setUserLastName] = useState(() => sessionStorage.getItem('userLastName') || "");

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
        .select('last_name, first_name')
        .eq('telegram_id', telegramId)
        .single();

      const lastName = whitelistData?.last_name || '';
      const firstName = whitelistData?.first_name || '';

      setUserLastName(lastName);
      setUserFirstName(firstName);

      // Save to sessionStorage for instant access on next mount
      sessionStorage.setItem('userLastName', lastName);
      sessionStorage.setItem('userFirstName', firstName);

      fetchWarehouses();
      fetchItems();
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/");
      }
    });

    // Real-time subscriptions for live updates
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
        }
      });

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(itemsChannel);
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.model && item.model.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.manufacturer && item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (selectedWarehouses.length > 0) {
      filtered = filtered.filter(item => selectedWarehouses.includes(item.warehouse));
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(item => selectedCategories.includes(item.category));
    }

    if (selectedItemTypes.length > 0) {
      filtered = filtered.filter(item => selectedItemTypes.includes(item.item_type));
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
  }, [items, searchQuery, selectedWarehouses, selectedCategories, selectedItemTypes, sortOrder]);

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
              variant="outline"
              onClick={() => setIsFilterDialogOpen(true)}
              className="w-full !bg-white !text-black hover:!bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Фильтры
              {(() => {
                const activeFiltersCount =
                  selectedWarehouses.length +
                  selectedCategories.length +
                  selectedItemTypes.length;

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
                className={`flex-1 text-sm px-2 ${sortOrder === "asc" ? "" : "!bg-white !text-black hover:!bg-gray-50 !border-gray-300"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSortOrder(sortOrder === "asc" ? null : "asc");
                }}
                title="По возрастанию количества"
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                <span className="whitespace-nowrap">Возрастание</span>
              </Button>
              <Button
                variant={sortOrder === "desc" ? "default" : "outline"}
                className={`flex-1 text-sm px-2 ${sortOrder === "desc" ? "" : "!bg-white !text-black hover:!bg-gray-50 !border-gray-300"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSortOrder(sortOrder === "desc" ? null : "desc");
                }}
                title="По убыванию количества"
              >
                <ArrowDown className="h-4 w-4 mr-1" />
                <span className="whitespace-nowrap">Убывание</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Background message */}
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-none z-0 opacity-5 text-center px-4 max-w-full">
          <p className="text-lg sm:text-2xl md:text-4xl font-bold text-gray-500">
            Напишите Кириллу,<br />что он молодец.<br />Он обрадуется.
          </p>
          <p className="text-6xl sm:text-7xl md:text-8xl mt-4">😊</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12 relative z-10">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                <span className="sr-only">Загрузка...</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Загрузка предметов...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 relative z-10">
              {filteredItems.map(item => (
                <ItemCard key={item.id} item={item} onUpdate={fetchItems} userName={`${userFirstName} ${userLastName}`.trim() || "Пользователь"} />
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-8 text-muted-foreground relative z-10">
                Предметы не найдены
              </div>
            )}
          </>
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
        selectedWarehouses={selectedWarehouses}
        selectedCategories={selectedCategories}
        selectedItemTypes={selectedItemTypes}
        onWarehouseChange={setSelectedWarehouses}
        onCategoryChange={setSelectedCategories}
        onItemTypeChange={setSelectedItemTypes}
        onReset={() => {
          setSelectedWarehouses([]);
          setSelectedCategories([]);
          setSelectedItemTypes([]);
        }}
      />
    </div>
  );
};

export default Inventory;