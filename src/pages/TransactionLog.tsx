import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

type Transaction = {
  id: string;
  user_id: string;
  item_id: string;
  action: string;
  quantity: number;
  purpose: string | null;
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
      case "взять":
        return `Взял (${quantity} шт.)`;
      case "вернуть":
        return `Вернул (${quantity} шт.)`;
      case "пополнить":
        return `Пополнил (+${quantity} шт.)`;
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "взять":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "вернуть":
        return "text-green-600 bg-green-50 border-green-200";
      case "пополнить":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
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
                    <div className="text-sm mt-1">
                      <span className="font-medium">{transaction.items?.name || "Удаленный предмет"}</span>
                      {transaction.items?.model && (
                        <span className="text-muted-foreground ml-1">({transaction.items.model})</span>
                      )}
                    </div>
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
