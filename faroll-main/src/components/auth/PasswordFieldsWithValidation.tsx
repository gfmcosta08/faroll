import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordFieldsWithValidationProps {
  password: string;
  confirmPassword: string;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  disabled?: boolean;
}

export function PasswordFieldsWithValidation({
  password,
  confirmPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  disabled,
}: PasswordFieldsWithValidationProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordMinLength = password.length >= 6;
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsDontMatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="password">Senha *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              disabled={disabled}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar *</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              disabled={disabled}
              className={cn(
                "pr-10",
                passwordsMatch && "border-emerald-500 focus-visible:ring-emerald-500",
                passwordsDontMatch && "border-destructive focus-visible:ring-destructive"
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Indicadores de validação */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className={cn(
          "flex items-center gap-1",
          passwordMinLength ? "text-emerald-600 dark:text-emerald-500" : "text-muted-foreground"
        )}>
          {passwordMinLength ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
          Mín. 6 caracteres
        </div>
        {confirmPassword.length > 0 && (
          <div className={cn(
            "flex items-center gap-1",
            passwordsMatch ? "text-emerald-600 dark:text-emerald-500" : "text-destructive"
          )}>
            {passwordsMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {passwordsMatch ? "Senhas coincidem" : "Senhas não coincidem"}
          </div>
        )}
      </div>
    </div>
  );
}
