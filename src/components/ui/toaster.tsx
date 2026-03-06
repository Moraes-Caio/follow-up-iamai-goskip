import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

const variantIcons = {
  default: <Info className="h-4 w-4 text-primary shrink-0" />,
  destructive: <AlertCircle className="h-4 w-4 text-destructive-foreground shrink-0" />,
  success: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0" />,
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = variantIcons[variant as keyof typeof variantIcons] || variantIcons.default;
        return (
          <Toast key={id} variant={variant} {...props} duration={3000} className="py-2 px-3 text-sm">
            <div className="flex items-start gap-2">
              {icon}
              <div className="grid gap-0.5">
                {title && <ToastTitle className="text-sm">{title}</ToastTitle>}
                {description && <ToastDescription className="text-xs">{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
