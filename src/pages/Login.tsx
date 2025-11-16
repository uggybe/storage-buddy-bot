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
      // СНАЧАЛА проверяем whitelist БЕЗ авторизации
      console.log("Checking whitelist first...");
      const { data: isWhitelisted, error: whitelistError } = await supabase.rpc('is_telegram_user_whitelisted', {
        user_telegram_id: telegramId
      });

      if (whitelistError) {
        console.error("Whitelist check error:", whitelistError);
        throw new Error(`Ошибка проверки доступа: ${whitelistError.message}`);
      }

      console.log("Whitelist check result:", isWhitelisted);

      if (!isWhitelisted) {
        console.log("User not in whitelist");
        setAuthError(`У вас нет доступа к этому приложению.\nВаш Telegram ID: ${telegramId}\nОбратитесь к администратору.`);
        setIsLoading(false);
        return false;
      }

      // Пользователь в whitelist - продолжаем авторизацию
      setDebugInfo(`Вход в систему для ${userName}...`);

      // Create unique email based on Telegram ID
      const telegramEmail = `telegram_${telegramId}@telegram.app`;
      const telegramPassword = `tg_secure_${telegramId}_${process.env.REACT_APP_TELEGRAM_SECRET || 'secret'}`;

      console.log("Attempting sign in...");

      // Try to sign in first with timeout
      const signInPromise = supabase.auth.signInWithPassword({
        email: telegramEmail,
        password: telegramPassword,
      });

      const signInTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Sign in timeout")), 10000)
      );

      const { error: signInError } = await Promise.race([
        signInPromise,
        signInTimeout
      ]) as any;

      if (signInError) {
        console.log("Sign in failed, trying sign up:", signInError.message);
        setDebugInfo("Создание нового аккаунта...");

        // If sign in fails, try to sign up with timeout
        const signUpPromise = supabase.auth.signUp({
          email: telegramEmail,
          password: telegramPassword,
          options: {
            data: {
              name: userName,
              telegram_id: telegramId,
              telegram_username: telegramUser.username || '',
            },
            emailRedirectTo: undefined, // Disable email confirmation
          },
        });

        const signUpTimeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Sign up timeout")), 10000)
        );

        const { data: signUpData, error: signUpError } = await Promise.race([
          signUpPromise,
          signUpTimeout
        ]) as any;

        if (signUpError) {
          console.error("Sign up error:", signUpError);
          throw signUpError;
        }

        console.log("Sign up successful, creating app_users record...");

        // Создаем запись в app_users вручную
        if (signUpData?.user) {
          const { error: appUserError } = await supabase
            .from('app_users')
            .insert({
              user_id: signUpData.user.id,
              name: userName
            });

          if (appUserError) {
            console.error("Error creating app_users record:", appUserError);
            // Не критично, продолжаем
          }
        }
      } else {
        console.log("Sign in successful");

        // Check if user's Telegram name has changed
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.user) {
          const { data: appUser } = await supabase
            .from('app_users')
            .select('id, name')
            .eq('user_id', currentSession.user.id)
            .single();

          if (appUser && appUser.name !== userName) {
            console.log(`Name changed from "${appUser.name}" to "${userName}"`);

            // Update name in app_users
            await supabase
              .from('app_users')
              .update({ name: userName })
              .eq('user_id', currentSession.user.id);

            // Save updated name to sessionStorage
            sessionStorage.setItem('userName', userName);

            // Log the name change
            await supabase
              .from('transactions')
              .insert({
                user_id: appUser.id,
                action: 'имя изменено',
                quantity: 0,
                item_name: null,
                category_name: null,
                details: {
                  old_name: appUser.name,
                  new_name: userName,
                  telegram_id: telegramId
                }
              });

            // Notify user about name change
            console.log(`Имя обновлено: ${appUser.name} → ${userName}`);
          }
        }
      }

      // Check session after auth
      setDebugInfo("Проверка входа...");
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Сессия не создана после авторизации");
      }

      console.log("Access granted, navigating to inventory");
      toast.success(`С возвращением, ${userName}!`);
      navigate("/inventory");

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
        const success = await handleTelegramAuth();

        // If auth was successful, navigation already happened in handleTelegramAuth
        if (!success) {
          console.log("Telegram auth failed");
        }
      } catch (error) {
        console.error("Init auth error:", error);
        if (mounted) {
          setAuthError(`Ошибка инициализации: ${error}`);
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
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