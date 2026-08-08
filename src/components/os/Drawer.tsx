"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import {
  Drawer as DrawerMobile,
  DrawerPortal as DrawerMobilePortal,
  DrawerOverlay as DrawerMobileOverlay,
  DrawerTrigger as DrawerMobileTrigger,
  DrawerClose as DrawerMobileClose,
  DrawerContent as DrawerMobileContent,
  DrawerHeader as DrawerMobileHeader,
  DrawerFooter as DrawerMobileFooter,
  DrawerTitle as DrawerMobileTitle,
  DrawerDescription as DrawerMobileDescription,
} from "@/components/ui/drawer"
import { cn } from "@/lib/ui/cn"

export function Drawer({ children, ...props }: React.ComponentPropsWithoutRef<typeof Dialog>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  if (isDesktop) return <Dialog {...props}>{children}</Dialog>
  return <DrawerMobile {...props}>{children}</DrawerMobile>
}

export function DrawerTrigger(props: React.ComponentPropsWithoutRef<typeof DialogTrigger>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  if (isDesktop) return <DialogTrigger {...props} />
  return <DrawerMobileTrigger {...props} />
}

export function DrawerClose(props: React.ComponentPropsWithoutRef<typeof DialogClose>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  if (isDesktop) return <DialogClose {...props} />
  return <DrawerMobileClose {...props} />
}

export const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
        <DialogPrimitive.Content
          ref={ref}
          className={cn(
            "fixed right-0 top-0 z-50 h-full w-full max-w-md gap-4 border-l bg-background p-6 shadow-2xl transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-300",
            className
          )}
          {...props}
        >
          {children}
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    )
  }

  return (
    <DrawerMobileContent className={cn("px-4 pb-4 pt-2", className)} {...props}>
      {children}
    </DrawerMobileContent>
  )
})
DrawerContent.displayName = "DrawerContent"

export function DrawerHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  if (isDesktop) {
    return <div className={cn("flex flex-col space-y-1.5 text-left mb-6", className)} {...props} />
  }
  return <DrawerMobileHeader className={cn("text-left px-0", className)} {...props} />
}

export function DrawerFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  if (isDesktop) {
    return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-auto pt-6", className)} {...props} />
  }
  return <DrawerMobileFooter className={cn("px-0", className)} {...props} />
}

export function DrawerTitle(props: React.ComponentPropsWithoutRef<typeof DialogTitle>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  if (isDesktop) return <DialogTitle {...props} />
  return <DrawerMobileTitle {...props} />
}

export function DrawerDescription(props: React.ComponentPropsWithoutRef<typeof DialogDescription>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  if (isDesktop) return <DialogDescription {...props} />
  return <DrawerMobileDescription {...props} />
}
