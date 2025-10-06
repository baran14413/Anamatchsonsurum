"use client"

import { useToast } from "@/hooks/use-toast"
import {
  MotionToast,
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { AnimatePresence } from "framer-motion"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
       <AnimatePresence>
        {toasts.map(function ({ id, title, description, action, icon, ...props }) {
          return (
             <MotionToast
              key={id}
              layout
              initial={{ opacity: 0, y: 50, scale: 0.3 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              className="flex items-start gap-4 p-4 pr-8 rounded-xl shadow-lg"
              {...props}
            >
              {icon && <div className="flex-shrink-0">{icon}</div>}
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
              {action}
              <ToastClose />
            </MotionToast>
          )
        })}
      </AnimatePresence>
      <ToastViewport />
    </ToastProvider>
  )
}
