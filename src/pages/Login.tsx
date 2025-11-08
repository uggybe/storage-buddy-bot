import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const Login = () => {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error("Введите ваше имя");
      return;
    }

    setIsLoading(true);

    try {
      // Check if user exists
      const { data: existingUser } = await supabase
        .from("app_users")
        .select("*")
        .eq("name", name.trim())
        .maybeSingle();

      if (!existingUser) {
        // Create new user
        const { error } = await supabase
          .from("app_users")
          .insert({ name: name.trim() });

        if (error) throw error;
      }

      // Store user in localStorage
      localStorage.setItem("warehouse_user", name.trim());
      toast.success("Добро пожаловать!");
      navigate("/inventory");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Ошибка входа");
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
          <CardDescription>Введите ваше имя для входа</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Имя</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Загрузка..." : "Войти"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;