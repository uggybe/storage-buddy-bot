import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';
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
        .order("created_at", { ascending: false })
        .limit(100);

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

  const getActionText = (action: string, quantity: number) => {
    switch (action) {
      case "взято":
        return `Взял (${quantity} шт.)`;
      case "возвращено":
        return `Вернул (${quantity} шт.)`;
      case "пополнено":
        return `Пополнил (+${quantity} шт.)`;
      case "создано":
        return `Создал предмет (${quantity} шт.)`;
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
      default:
        return action;
    }
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
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const exportToExcel = async () => {
    try {
      // Fetch all transactions (not just 100)
      const { data, error } = await supabase
        .from("transactions")
        .select(`
          *,
          app_users (name),
          items (name, model)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Prepare data for Excel
      const excelData = (data || []).map((t: Transaction) => ({
        'Дата': formatDate(t.created_at),
        'Пользователь': t.app_users?.name || 'Неизвестный',
        'Действие': getActionText(t.action, t.quantity),
        'Предмет': t.item_name || t.items?.name || 'Категория',
        'Модель': t.items?.model || '',
        'Категория': t.category_name || '',
        'Количество': t.quantity,
        'Назначение': t.purpose || '',
        'Детали': t.details ? JSON.stringify(t.details) : '',
      }));

      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Журнал событий');

      // Set column widths
      const colWidths = [
        { wch: 18 }, // Дата
        { wch: 20 }, // Пользователь
        { wch: 25 }, // Действие
        { wch: 30 }, // Предмет
        { wch: 20 }, // Модель
        { wch: 20 }, // Категория
        { wch: 12 }, // Количество
        { wch: 40 }, // Назначение
        { wch: 40 }, // Детали
      ];
      ws['!cols'] = colWidths;

      // Generate filename with current date
      const fileName = `Журнал_событий_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download file
      XLSX.writeFile(wb, fileName);

      toast.success("Excel файл экспортирован");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Ошибка экспорта в Excel");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/inventory")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <img src={logo} alt="ЦЭПП Services" className="h-10" />
              <h1 className="text-xl font-semibold">Журнал событий</h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToExcel}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Экспорт в Excel</span>
            </Button>
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
                        {getActionText(transaction.action, transaction.quantity)}
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
                        Назначение: {transaction.purpose}
                      </div>
                    )}
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
