'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveDialog, ResponsiveDialogTrigger, ResponsiveDialogContent, ResponsiveDialogHeader, ResponsiveDialogTitle, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogClose } from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';

export function Patterns() {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <section className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-2 border-b pb-2">PATTERNS</h3>
        <p className="text-muted-foreground">Common UI components and interaction patterns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Buttons */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Buttons</h4>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Badges</h4>
          <div className="flex flex-wrap gap-4">
            <Badge variant="neutral">Neutral</Badge>
            <Badge variant="positive">Positive</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="negative">Negative</Badge>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Inputs & Controls</h4>
          <div className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="Enter your email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="disabled">Disabled Input</Label>
              <Input id="disabled" disabled placeholder="Disabled" />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Accept terms and conditions</Label>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch id="airplane-mode" />
              <Label htmlFor="airplane-mode">Airplane Mode</Label>
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Dialogs & Sheets</h4>
          <div className="space-y-4">
            <ResponsiveDialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <ResponsiveDialogTrigger asChild>
                <Button variant="secondary">Open Responsive Dialog</Button>
              </ResponsiveDialogTrigger>
              <ResponsiveDialogContent>
                <ResponsiveDialogHeader>
                  <ResponsiveDialogTitle>Edit Profile</ResponsiveDialogTitle>
                  <ResponsiveDialogDescription>Make changes to your profile here. Click save when you&apos;re done.</ResponsiveDialogDescription>
                </ResponsiveDialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" defaultValue="Eric Gitahi" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue="@gitahi77" />
                  </div>
                </div>
                <ResponsiveDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4">
                  <ResponsiveDialogClose asChild>
                    <Button variant="ghost">Cancel</Button>
                  </ResponsiveDialogClose>
                  <ResponsiveDialogClose asChild>
                    <Button variant="primary">Save changes</Button>
                  </ResponsiveDialogClose>
                </ResponsiveDialogFooter>
              </ResponsiveDialogContent>
            </ResponsiveDialog>
            <p className="text-sm text-muted-foreground">
              Resizes the browser. On desktop (&gt;=768px), this opens a centered Dialog. On mobile, it opens a bottom Drawer.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="space-y-4 md:col-span-2">
          <h4 className="text-lg font-semibold border-b pb-2">Cards</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card Description</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Card Content goes here.</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Action</Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle>Muted Card</CardTitle>
                <CardDescription>Useful for secondary information.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Some muted content.</p>
              </CardContent>
            </Card>

            <Card className="border-primary/50 shadow-sm">
              <CardHeader>
                <CardTitle>Highlighted Card</CardTitle>
                <CardDescription>Draws attention to specific actions.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Important content.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
