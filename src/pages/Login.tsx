import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Login = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const navigate = useNavigate();

  // Auto-login via Telegram
  const handleTelegramAuth = async () => {
    console.log("Starting Telegram auth...");
    setDebugInfo("Проверка Telegram WebApp...");

    // Wait for Telegram WebApp to initialize with timeout
    let attempts = 0;
    const maxAttempts = 20; // 2 seconds total

    while (attempts < maxAttempts) {
      const tg = window.Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user) {
        console.log("Telegram WebApp found:", tg.initDataUnsafe.user);
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user) {
      console.error("Telegram WebApp not found after waiting");
      setAuthError("Это приложение работает только через Telegram Mini App");
      setIsLoading(false);
      return false;
    }

    const telegramUser = tg.initDataUnsafe.user;
    const telegramId = telegramUser.id;
    const userName = telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : '');

    console.log("Telegram user:", telegramId, userName);
    setDebugInfo(`Проверка доступа для ${userName}...`);

    try {
      // Check whitelist first with timeout
      console.log("Checking whitelist for:", telegramId);
      const whitelistPromise = supabase.rpc('is_telegram_user_whitelisted', {
        user_telegram_id: telegramId
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout checking whitelist")), 10000)
      );

      const { data: isWhitelisted, error: whitelistError } = await Promise.race([
        whitelistPromise,
        timeoutPromise
      ]) as any;

      if (whitelistError) {
        console.error("Whitelist error:", whitelistError);
        throw whitelistError;
      }

      console.log("Whitelist check result:", isWhitelisted);

      if (!isWhitelisted) {
        setAuthError(`У вас нет доступа к этому приложению. Ваш Telegram ID: ${telegramId}`);
        setIsLoading(false);
        return false;
      }

      setDebugInfo("Вход в систему...");

      // Create unique email based on Telegram ID
      const telegramEmail = `telegram_${telegramId}@telegram.app`;
      const telegramPassword = `tg_secure_${telegramId}_${process.env.REACT_APP_TELEGRAM_SECRET || 'secret'}`;

      console.log("Attempting sign in...");
      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: telegramEmail,
        password: telegramPassword,
      });

      if (signInError) {
        console.log("Sign in failed, trying sign up:", signInError.message);
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

        if (signUpError) {
          console.error("Sign up error:", signUpError);
          throw signUpError;
        }

        console.log("Sign up successful");
        toast.success(`Добро пожаловать, ${userName}!`);
      } else {
        console.log("Sign in successful");
        toast.success(`С возвращением, ${userName}!`);
      }

      return true;
    } catch (error: any) {
      console.error("Telegram auth error:", error);
      setAuthError(`Ошибка входа: ${error.message || "Неизвестная ошибка"}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        console.log("Initializing auth...");
        setDebugInfo("Проверка сессии...");

        // Check if user is already logged in
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (session) {
          console.log("Session found, redirecting to inventory");
          navigate("/inventory");
          return;
        }

        console.log("No session, attempting Telegram auth");
        // Try Telegram auto-login if not logged in
        await handleTelegramAuth();
      } catch (error) {
        console.error("Init auth error:", error);
        if (mounted) {
          setAuthError("Ошибка инициализации");
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
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
          {authError ? (
            <div className="text-center py-8">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 whitespace-pre-wrap">{authError}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Откройте консоль браузера (F12) для подробной информации
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{debugInfo || "Инициализация..."}</p>
              {isLoading && (
                <p className="text-xs text-muted-foreground mt-4">
                  Проверьте консоль браузера (F12) для отладки
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;