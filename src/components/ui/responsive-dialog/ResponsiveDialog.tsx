"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "@/lib/ui/cn"

interface ResponsiveDialogProps extends React.ComponentPropsWithoutRef<typeof Dialog> {
  desktopThreshold?: string // e.g. "(min-width: 768px)"
}

export function ResponsiveDialog({
  children,
  desktopThreshold = "(min-width: 768px)",
  ...props
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery(desktopThreshold)

  if (isDesktop) {
    return <Dialog {...props}>{children}</Dialog>
  }

  return <Drawer {...props}>{children}</Drawer>
}

export function ResponsiveDialogTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogTrigger>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <DialogTrigger className={className} {...props}>
        {children}
      </DialogTrigger>
    )
  }

  return (
    <DrawerTrigger className={className} {...props}>
      {children}
    </DrawerTrigger>
  )
}

export function ResponsiveDialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogContent>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <DialogContent className={className} {...props}>
        {children}
      </DialogContent>
    )
  }

  return (
    <DrawerContent className={cn("px-4 pb-4 pt-2", className)} {...props}>
      {children}
    </DrawerContent>
  )
}

export function ResponsiveDialogHeader({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogHeader>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <DialogHeader className={className} {...props}>
        {children}
      </DialogHeader>
    )
  }

  return (
    <DrawerHeader className={cn("text-left px-0", className)} {...props}>
      {children}
    </DrawerHeader>
  )
}

export function ResponsiveDialogTitle({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogTitle>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <DialogTitle className={className} {...props}>
        {children}
      </DialogTitle>
    )
  }

  return (
    <DrawerTitle className={className} {...props}>
      {children}
    </DrawerTitle>
  )
}

export function ResponsiveDialogDescription({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogDescription>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <DialogDescription className={className} {...props}>
        {children}
      </DialogDescription>
    )
  }

  return (
    <DrawerDescription className={className} {...props}>
      {children}
    </DrawerDescription>
  )
}

export function ResponsiveDialogFooter({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogFooter>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <DialogFooter className={className} {...props}>
        {children}
      </DialogFooter>
    )
  }

  return (
    <DrawerFooter className={cn("px-0", className)} {...props}>
      {children}
    </DrawerFooter>
  )
}

export function ResponsiveDialogClose({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogClose>) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <DialogClose className={className} {...props}>
        {children}
      </DialogClose>
    )
  }

  return (
    <DrawerClose className={className} {...props}>
      {children}
    </DrawerClose>
  )
}
