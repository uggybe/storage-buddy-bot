import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, BookOpen, ArrowUp, ArrowDown, Filter, Database } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { ItemCard } from "@/components/ItemCard";
import { AddItemDialog } from "@/components/AddItemDialog";
import { FilterDialog } from "@/components/FilterDialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

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
  const [isDatabaseMenuOpen, setIsDatabaseMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState(() => sessionStorage.getItem('userName') || "");

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

      // Get user's name from app_users table (same name shown everywhere including transaction log)
      const { data: appUserData } = await supabase
        .from('app_users')
        .select('name')
        .eq('user_id', session.user.id)
        .single();

      const name = appUserData?.name || 'Пользователь';

      setUserName(name);

      // Save to sessionStorage for instant access on next mount
      sessionStorage.setItem('userName', name);

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

  const exportDatabase = async () => {
    try {
      toast.info("Подготовка резервной копии...");

      // Fetch all data from main tables
      const [itemsRes, categoriesRes, warehousesRes, transactionsRes, appUsersRes] = await Promise.all([
        supabase.from("items").select("*").order("created_at"),
        supabase.from("categories").select("*").order("name"),
        supabase.from("warehouses").select("*").order("name"),
        supabase.from("transactions").select(`
          *,
          app_users (name),
          items (name, model)
        `).order("created_at", { ascending: false }).limit(1000),
        supabase.from("app_users").select("*").order("created_at"),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (warehousesRes.error) throw warehousesRes.error;
      if (transactionsRes.error) throw transactionsRes.error;
      if (appUsersRes.error) throw appUsersRes.error;

      // Download photos from Storage and convert to base64
      toast.info("Загрузка фотографий...");
      const photos: { [key: string]: string } = {};

      if (itemsRes.data) {
        for (const item of itemsRes.data) {
          if (item.photos && Array.isArray(item.photos)) {
            for (const photoUrl of item.photos) {
              if (photoUrl && !photos[photoUrl]) {
                try {
                  // Extract file path from URL
                  const urlParts = photoUrl.split('/');
                  const fileName = urlParts[urlParts.length - 1];

                  // Download photo
                  const { data: photoData, error: photoError } = await supabase
                    .storage
                    .from('item-photos')
                    .download(fileName);

                  if (!photoError && photoData) {
                    // Convert to base64
                    const reader = new FileReader();
                    const base64Promise = new Promise<string>((resolve) => {
                      reader.onloadend = () => resolve(reader.result as string);
                      reader.readAsDataURL(photoData);
                    });
                    photos[photoUrl] = await base64Promise;
                  }
                } catch (err) {
                  console.error(`Error downloading photo ${photoUrl}:`, err);
                }
              }
            }
          }
        }
      }

      const backup = {
        export_date: new Date().toISOString(),
        version: "2.0",
        data: {
          items: itemsRes.data || [],
          categories: categoriesRes.data || [],
          warehouses: warehousesRes.data || [],
          transactions: transactionsRes.data || [],
          app_users: appUsersRes.data || [],
          photos: photos,
        },
        stats: {
          total_items: itemsRes.data?.length || 0,
          total_categories: categoriesRes.data?.length || 0,
          total_warehouses: warehousesRes.data?.length || 0,
          total_transactions: transactionsRes.data?.length || 0,
          total_app_users: appUsersRes.data?.length || 0,
          total_photos: Object.keys(photos).length,
        }
      };

      // Convert to JSON
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });

      // Generate filename with current date
      const fileName = `Резервная_копия_БД_${new Date().toISOString().split('T')[0]}.json`;

      // Check if mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Try Web Share API for mobile devices
      if (isMobile && navigator.share) {
        try {
          const file = new File([blob], fileName, { type: 'application/json' });
          await navigator.share({
            files: [file],
            title: 'Резервная копия БД',
            text: 'Резервная копия базы данных'
          });
          toast.success("✅ Файл отправлен!");
          return;
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.log('Share failed, trying download:', err);
          } else {
            return; // User cancelled
          }
        }
      }

      // Standard download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);

      const statsMsg = `📦 Резервная копия сохранена!\n` +
        `Предметов: ${backup.stats.total_items}\n` +
        `Пользователей: ${backup.stats.total_app_users}\n` +
        `Фотографий: ${backup.stats.total_photos}`;
      toast.success(statsMsg);
    } catch (error: any) {
      console.error("Error exporting database:", error);
      toast.error("Ошибка экспорта: " + (error.message || "Неизвестная ошибка"));
    }
  };

  const importDatabase = async () => {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';

    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        toast.info("Чтение файла...");

        // Read file
        const text = await file.text();
        const backup = JSON.parse(text);

        // Validate structure
        if (!backup.data || !backup.version) {
          throw new Error("Неверный формат файла резервной копии");
        }

        const { items, categories, warehouses, photos, app_users } = backup.data;

        // Confirm restoration
        const confirmed = window.confirm(
          `Восстановить базу данных?\n\n` +
          `Предметов: ${items?.length || 0}\n` +
          `Категорий: ${categories?.length || 0}\n` +
          `Складов: ${warehouses?.length || 0}\n` +
          `Пользователей: ${app_users?.length || 0}\n` +
          `Фотографий: ${photos ? Object.keys(photos).length : 0}\n\n` +
          `⚠️ ВНИМАНИЕ: Существующие данные будут удалены!`
        );

        if (!confirmed) {
          toast.info("Восстановление отменено");
          return;
        }

        toast.info("Восстановление базы данных...");

        // Delete existing data (in reverse order due to foreign keys)
        await supabase.from("transactions").delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from("items").delete().neq('id', '00000000-0000-0000-0000-000000000000');

        // Restore warehouses first (if any)
        if (warehouses && warehouses.length > 0) {
          const { error: whError } = await supabase.from("warehouses").insert(warehouses);
          if (whError) console.error("Warning: warehouses restore error:", whError);
        }

        // Restore categories (if any)
        if (categories && categories.length > 0) {
          const { error: catError } = await supabase.from("categories").insert(categories);
          if (catError) console.error("Warning: categories restore error:", catError);
        }

        // Restore photos to Storage
        if (photos && Object.keys(photos).length > 0) {
          toast.info("Восстановление фотографий...");
          const photoUrlMap: { [oldUrl: string]: string } = {};

          for (const [oldUrl, base64Data] of Object.entries(photos)) {
            try {
              // Extract filename from old URL
              const urlParts = oldUrl.split('/');
              const fileName = urlParts[urlParts.length - 1];

              // Convert base64 to Blob
              const base64Response = await fetch(base64Data);
              const blob = await base64Response.blob();

              // Upload to Storage
              const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('item-photos')
                .upload(fileName, blob, {
                  upsert: true,
                  contentType: blob.type
                });

              if (!uploadError && uploadData) {
                // Get public URL
                const { data: urlData } = supabase
                  .storage
                  .from('item-photos')
                  .getPublicUrl(fileName);

                photoUrlMap[oldUrl] = urlData.publicUrl;
              }
            } catch (err) {
              console.error(`Error restoring photo ${oldUrl}:`, err);
            }
          }

          // Update photo URLs in items
          if (items) {
            for (const item of items) {
              if (item.photos && Array.isArray(item.photos)) {
                item.photos = item.photos.map((oldUrl: string) => photoUrlMap[oldUrl] || oldUrl);
              }
            }
          }
        }

        // Restore items
        if (items && items.length > 0) {
          toast.info("Восстановление предметов...");
          // Insert in batches of 100 to avoid payload size limits
          const batchSize = 100;
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const { error: itemError } = await supabase.from("items").insert(batch);
            if (itemError) {
              console.error("Error restoring items batch:", itemError);
              throw itemError;
            }
          }
        }

        const statsMsg = `✅ База данных восстановлена!\n` +
          `Предметов: ${items?.length || 0}\n` +
          `Фотографий: ${photos ? Object.keys(photos).length : 0}`;
        toast.success(statsMsg);

        // Refresh data
        fetchItems();
        fetchWarehouses();
        setIsDatabaseMenuOpen(false);

      } catch (error: any) {
        console.error("Error importing database:", error);
        toast.error("Ошибка восстановления: " + (error.message || "Неизвестная ошибка"));
      }
    };

    input.click();
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
                <span className="truncate max-w-[120px]">{userName || "Пользователь"}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDatabaseMenuOpen(true)}
                title="Управление базой данных"
                className="flex-shrink-0 h-8 w-8 p-0"
              >
                <Database className="h-4 w-4" />
              </Button>
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
                <ItemCard key={item.id} item={item} onUpdate={fetchItems} userName={userName || "Пользователь"} />
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

      <Sheet open={isDatabaseMenuOpen} onOpenChange={setIsDatabaseMenuOpen}>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Управление базой данных</SheetTitle>
            <SheetDescription>
              Экспорт и восстановление данных
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                importDatabase();
              }}
              className="w-full text-base"
            >
              📥 Восстановить БД
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                exportDatabase();
                setIsDatabaseMenuOpen(false);
              }}
              className="w-full text-base"
            >
              📦 Скачать БД
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Inventory;