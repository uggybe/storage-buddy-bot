import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTelegramAuth, setIsTelegramAuth] = useState(false);
  const navigate = useNavigate();

  // Auto-login via Telegram
  const handleTelegramAuth = async () => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user) {
      return false;
    }

    const telegramUser = tg.initDataUnsafe.user;
    const telegramId = telegramUser.id;
    const userName = telegramUser.first_name + (telegramUser.last_name ? ` ${telegramUser.last_name}` : '');

    // Create unique email based on Telegram ID
    const telegramEmail = `telegram_${telegramId}@telegram.app`;
    const telegramPassword = `tg_secure_${telegramId}_${process.env.REACT_APP_TELEGRAM_SECRET || 'secret'}`;

    setIsLoading(true);
    setIsTelegramAuth(true);

    try {
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
      toast.error("Ошибка автоматического входа через Telegram");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/inventory");
        return;
      }

      // Try Telegram auto-login if not logged in
      handleTelegramAuth();
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/inventory");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;
      
      toast.success("Вход выполнен!");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Ошибка входа");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim() || !name.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    if (password.length < 6) {
      toast.error("Пароль должен содержать минимум 6 символов");
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            name: name.trim(),
          },
          emailRedirectTo: `${window.location.origin}/inventory`,
        },
      });

      if (error) throw error;
      
      toast.success("Регистрация выполнена!");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Ошибка регистрации");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="ЦЭПП Services" className="h-16 mx-auto mb-4" />
          <CardTitle className="text-2xl">Складской учет</CardTitle>
          <CardDescription>
            {isTelegramAuth ? "Вход через Telegram..." : "Войдите или зарегистрируйтесь"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isTelegramAuth ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Выполняется вход через Telegram...</p>
            </div>
          ) : (
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="signup">Регистрация</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Пароль</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Загрузка..." : "Войти"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Имя</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Ваше имя"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Пароль</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Загрузка..." : "Зарегистрироваться"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;