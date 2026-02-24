import { useState } from "react";
import { AuthLoginForm } from "./AuthLoginForm";
import { AuthRegisterForm } from "./AuthRegisterForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type AuthMode = "login" | "register";

interface AuthScreenProps {
  onBackToLanding?: () => void;
}

export function AuthScreen({ onBackToLanding }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>("login");

  if (mode === "register") {
    return (
      <div className="relative">
        {onBackToLanding && (
          <div className="absolute top-4 left-4 z-50">
            <Button variant="ghost" onClick={onBackToLanding} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para início
            </Button>
          </div>
        )}
        <AuthRegisterForm onSwitchToLogin={() => setMode("login")} />
      </div>
    );
  }

  return (
    <div className="relative">
      {onBackToLanding && (
        <div className="absolute top-4 left-4 z-50">
          <Button variant="ghost" onClick={onBackToLanding} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para início
          </Button>
        </div>
      )}
      <AuthLoginForm onSwitchToRegister={() => setMode("register")} />
    </div>
  );
}
