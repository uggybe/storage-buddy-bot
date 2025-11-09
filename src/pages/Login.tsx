import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Login = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Auto-login via Telegram
  const handleTelegramAuth = async () => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user) {
      setAuthError("Это приложение работает только через Telegram Mini App");
      return false;
    }

    const telegramUser = tg.initDataUnsafe.user;
    const telegramId = telegramUser.id;
    const userName = telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : '');

    setIsLoading(true);
    setAuthError(null);

    try {
      // Check whitelist first
      const { data: isWhitelisted } = await supabase.rpc('is_telegram_user_whitelisted', {
        user_telegram_id: telegramId
      });

      if (!isWhitelisted) {
        setAuthError("У вас нет доступа к этому приложению. Обратитесь к администратору.");
        setIsLoading(false);
        return false;
      }

      // Create unique email based on Telegram ID
      const telegramEmail = `telegram_${telegramId}@telegram.app`;
      const telegramPassword = `tg_secure_${telegramId}_${process.env.REACT_APP_TELEGRAM_SECRET || 'secret'}`;

      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: telegramEmail,
        password: telegramPassword,
      });

      if (signInError) {
        // If sign in fails, try to sign up
        const { error: signUpError } = await supabase.auth.signUp({
          email: telegramEmail,
          password: telegramPassword,
          options: {
            data: {
              name: userName,
              telegram_id: telegramId,
              telegram_username: telegramUser.username || '',
            },
          },
        });

        if (signUpError) throw signUpError;

        toast.success(`Добро пожаловать, ${userName}!`);
      } else {
        toast.success(`С возвращением, ${userName}!`);
      }

      return true;
    } catch (error: any) {
      console.error("Telegram auth error:", error);
      setAuthError("Ошибка автоматического входа через Telegram");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (session) {
        navigate("/inventory");
        return;
      }

      // Wait a bit for Telegram WebApp to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      if (!mounted) return;

      // Try Telegram auto-login if not logged in
      await handleTelegramAuth();
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && mounted) {
        navigate("/inventory");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="ЦЭПП Services" className="h-16 mx-auto mb-4" />
          <CardTitle className="text-2xl">Складской учет</CardTitle>
          <CardDescription>
            Telegram Mini App
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Вход через Telegram...</p>
            </div>
          ) : authError ? (
            <div className="text-center py-8 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{authError}</p>
              </div>
              <Button
                onClick={() => {
                  setAuthError(null);
                  handleTelegramAuth();
                }}
                className="w-full"
              >
                Попробовать снова
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Инициализация...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;