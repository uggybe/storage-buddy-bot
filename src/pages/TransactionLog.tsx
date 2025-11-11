import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type Transaction = {
  id: string;
  user_id: string;
  item_id: string | null;
  action: string;
  quantity: number;
  purpose: string | null;
  item_name: string | null;
  category_name: string | null;
  warehouse_returned: string | null;
  location_details: string | null;
  details: any;
  created_at: string;
  app_users: {
    name: string;
  } | null;
  items: {
    name: string;
    model: string | null;
  } | null;
};

const TransactionLog = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
        return;
      }
      fetchTransactions();
    });
  }, [navigate]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          app_users (name),
          items (name, model)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Ошибка загрузки журнала");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getFieldLabel = (field: string) => {
    const labels: { [key: string]: string } = {
      name: "Название",
      model: "Модель",
      category: "Категория",
      warehouse: "Склад",
      item_type: "Тип",
      location: "Местоположение",
      notes: "Примечания",
      quantity: "Количество",
    };
    return labels[field] || field;
  };

  const getActionText = (action: string, quantity: number, details: any) => {
    const itemType = details?.item_type;
    const isMultiple = itemType === "множественный";

    switch (action) {
      case "взято":
        return isMultiple ? `Взял ${quantity} шт.` : "Взял";
      case "возвращено":
        return isMultiple ? `Вернул ${quantity} шт.` : "Вернул";
      case "пополнено":
        return `Пополнил +${quantity} шт.`;
      case "создано":
        return isMultiple ? `Создал предмет (количество: ${quantity} шт.)` : "Создал предмет";
      case "изменено":
        return `Изменил предмет`;
      case "удалено":
        return `Удалил предмет`;
      case "категория создана":
        return `Создал категорию`;
      case "категория изменена":
        return `Изменил категорию`;
      case "категория удалена":
        return `Удалил категорию`;
      case "склад создан":
        return `Создал склад`;
      case "склад изменен":
        return `Изменил склад`;
      case "склад удален":
        return `Удалил склад`;
      default:
        return action;
    }
  };

  // Render quantity change details
  const renderQuantityChange = (details: any, quantity: number, action: string) => {
    const oldQty = details?.old_quantity;
    const newQty = details?.new_quantity;

    if (oldQty === undefined || newQty === undefined) return null;

    let changeText = "";
    if (action === "взято") {
      changeText = `Было ${oldQty} → убрал ${quantity} → стало ${newQty}`;
    } else if (action === "возвращено") {
      changeText = `Было ${oldQty} → вернул ${quantity} → стало ${newQty}`;
    } else if (action === "пополнено") {
      changeText = `Было ${oldQty} → добавил +${quantity} → стало ${newQty}`;
    }

    if (!changeText) return null;

    return (
      <div className="mt-1.5 text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1.5 border border-current/20">
        <span className="font-semibold">Количество:</span> {changeText}
      </div>
    );
  };

  const renderChanges = (details: any) => {
    if (!details?.changes || Object.keys(details.changes).length === 0) {
      return null;
    }

    return (
      <div className="mt-2 space-y-1.5">
        {Object.entries(details.changes).map(([field, change]: [string, any]) => {
          const oldVal = change.old || '—';
          const newVal = change.new || '—';

          return (
            <div key={field} className="text-xs bg-white/50 dark:bg-black/20 rounded px-2 py-1.5 border border-current/20">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{getFieldLabel(field)}:</span>
                <span className="text-muted-foreground line-through">{oldVal}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium text-foreground">{newVal}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "взято":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "возвращено":
        return "text-green-600 bg-green-50 border-green-200";
      case "пополнено":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "создано":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "изменено":
        return "text-indigo-600 bg-indigo-50 border-indigo-200";
      case "удалено":
        return "text-red-600 bg-red-50 border-red-200";
      case "категория создана":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "категория изменена":
        return "text-violet-600 bg-violet-50 border-violet-200";
      case "категория удалена":
        return "text-pink-600 bg-pink-50 border-pink-200";
      case "склад создан":
        return "text-cyan-600 bg-cyan-50 border-cyan-200";
      case "склад изменен":
        return "text-teal-600 bg-teal-50 border-teal-200";
      case "склад удален":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';

    // Get headers
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');

    // Get rows
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    }).join('\n');

    return `${csvHeaders}\n${csvRows}`;
  };

  const exportToExcel = async () => {
    try {
      toast.info("Подготовка файла...");

      // Fetch all transactions (not just 100)
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          app_users (name),
          items (name, model)
        `)
        .order("created_at", { ascending: false});

      if (error) throw error;

      // Prepare data for CSV with enhanced details
      const csvData = (data || []).map((t: Transaction) => {
        let detailsText = '';

        // Add quantity changes
        if (t.details?.old_quantity !== undefined && t.details?.new_quantity !== undefined) {
          if (t.action === "взято") {
            detailsText += `Было ${t.details.old_quantity} → убрал ${t.quantity} → стало ${t.details.new_quantity}`;
          } else if (t.action === "возвращено") {
            detailsText += `Было ${t.details.old_quantity} → вернул ${t.quantity} → стало ${t.details.new_quantity}`;
          } else if (t.action === "пополнено") {
            detailsText += `Было ${t.details.old_quantity} → добавил +${t.quantity} → стало ${t.details.new_quantity}`;
          }
        }

        // Add warehouse and location for returns
        if (t.action === "возвращено" && (t.warehouse_returned || t.location_details)) {
          if (detailsText) detailsText += ' | ';
          if (t.warehouse_returned) detailsText += `Склад: ${t.warehouse_returned}`;
          if (t.location_details) detailsText += ` | Место: ${t.location_details}`;
        }

        // Add changes for edit action
        if (t.action === "изменено" && t.details?.changes) {
          const changes = Object.entries(t.details.changes)
            .map(([field, change]: [string, any]) =>
              `${getFieldLabel(field)}: ${change.old || '—'} → ${change.new || '—'}`
            )
            .join(' | ');
          if (detailsText) detailsText += ' | ';
          detailsText += changes;
        }

        return {
          'Дата': formatDate(t.created_at),
          'Пользователь': t.app_users?.name || 'Неизвестный',
          'Действие': getActionText(t.action, t.quantity, t.details),
          'Предмет': t.item_name || t.items?.name || 'Категория',
          'Модель': t.items?.model || '',
          'Категория': t.category_name || '',
          'Назначение': t.purpose || '',
          'Детали': detailsText,
        };
      });

      // Convert to CSV
      const BOM = '\uFEFF';
      const csv = BOM + convertToCSV(csvData);

      // Generate filename with current date
      const fileName = `Журнал_событий_${new Date().toISOString().split('T')[0]}.csv`;

      // Check if running in Telegram WebApp
      const telegramWebApp = (window as any).Telegram?.WebApp;
      const chatId = telegramWebApp?.initDataUnsafe?.user?.id;
      const isInTelegram = !!telegramWebApp && telegramWebApp.platform !== 'unknown';

      console.log('Telegram context:', { chatId, platform: telegramWebApp?.platform, isInTelegram });

      // If in Telegram, send via bot
      if (isInTelegram && chatId) {
        toast.info("Отправка файла в Telegram...");

        try {
          const response = await supabase.functions.invoke('send-telegram-file', {
            body: { chatId, csvData: csv, fileName },
          });

          console.log("Edge Function response:", response);

          if (!response.error && response.data?.success) {
            toast.success("✅ Файл отправлен в Telegram! Проверьте чат с ботом.");
            return; // Don't try to download if sent successfully
          } else {
            console.error("Edge Function error:", response.error || response.data);
            throw new Error(response.data?.error || "Не удалось отправить файл");
          }
        } catch (err: any) {
          console.error("Telegram send failed:", err);
          toast.error(`Ошибка отправки в Telegram: ${err.message}`);

          // Fallback to download if Telegram send fails
          toast.info("Попытка обычного скачивания...");
        }
      }

      // Fallback: normal download (for desktop or if Telegram send failed)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      toast.success("Файл скачан!");
    } catch (error: any) {
      console.error("Error exporting:", error);
      toast.error("Ошибка экспорта файла: " + (error.message || "Неизвестная ошибка"));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/inventory")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={logo} alt="ЦЭПП Services" className="h-10" />
              <h1 className="text-lg sm:text-xl font-semibold truncate">Журнал событий</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                className="flex items-center gap-2"
                title="Отправить в Telegram"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Журнал событий пуст</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className={`p-3 border rounded-lg ${getActionColor(transaction.action)}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {transaction.app_users?.name || "Неизвестный пользователь"}
                      </span>
                      <span className="text-sm">
                        {getActionText(transaction.action, transaction.quantity, transaction.details)}
                      </span>
                    </div>
                    {(transaction.item_name || transaction.items?.name) && (
                      <div className="text-sm mt-1">
                        <span className="font-medium">
                          {transaction.item_name || transaction.items?.name}
                        </span>
                        {transaction.items?.model && (
                          <span className="text-muted-foreground ml-1">({transaction.items.model})</span>
                        )}
                      </div>
                    )}
                    {transaction.category_name && (
                      <div className="text-xs mt-1">
                        <span className="text-muted-foreground">Категория: </span>
                        <span className="font-medium">{transaction.category_name}</span>
                      </div>
                    )}
                    {transaction.purpose && (
                      <div className="text-xs mt-1 text-muted-foreground">
                        <span className="font-medium">Назначение:</span> {transaction.purpose}
                      </div>
                    )}

                    {/* Show quantity change for взято/возвращено/пополнено */}
                    {(transaction.action === "взято" || transaction.action === "возвращено" || transaction.action === "пополнено") &&
                      renderQuantityChange(transaction.details, transaction.quantity, transaction.action)}

                    {/* Show warehouse and location for return action */}
                    {transaction.action === "возвращено" && (transaction.warehouse_returned || transaction.location_details) && (
                      <div className="text-xs mt-1.5 bg-white/50 dark:bg-black/20 rounded px-2 py-1.5 border border-current/20">
                        {transaction.warehouse_returned && (
                          <>
                            <span className="font-semibold">Возврат на склад:</span> {transaction.warehouse_returned}
                          </>
                        )}
                        {transaction.location_details && (
                          <>
                            {transaction.warehouse_returned && " • "}
                            <span className="font-semibold">Место:</span> {transaction.location_details}
                          </>
                        )}
                      </div>
                    )}

                    {/* Show location for replenish action if available */}
                    {transaction.action === "пополнено" && transaction.details?.location && (
                      <div className="text-xs mt-1.5 bg-white/50 dark:bg-black/20 rounded px-2 py-1.5 border border-current/20">
                        <span className="font-semibold">Место хранения:</span> {transaction.details.location}
                      </div>
                    )}

                    {/* Show warehouse info */}
                    {transaction.details?.warehouse && transaction.action !== "возвращено" && (
                      <div className="text-xs mt-1 text-muted-foreground">
                        <span className="font-medium">Склад:</span> {transaction.details.warehouse}
                      </div>
                    )}

                    {/* Show all changes for edit action */}
                    {transaction.action === "изменено" && renderChanges(transaction.details)}
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDate(transaction.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TransactionLog;
