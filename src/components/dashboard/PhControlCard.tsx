"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Droplets, Power } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type PhControlCardProps = ComponentProps<typeof Card>;

export function PhControlCard({ className, ...props }: PhControlCardProps) {
  const [isPhAutomationEnabled, setIsPhAutomationEnabled] = useState(false);

  return (
    <Card className={cn("shadow-lg", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Droplets className="w-6 h-6 text-primary"/>Automated pH Balancer
        </CardTitle>
        <CardDescription>Manage the automated pH balancing system.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
          <Label htmlFor="ph-automation-toggle" className="flex items-center gap-2 text-base font-medium text-foreground">
            <Power className="w-5 h-5 text-primary" />
            Enable pH Automation
          </Label>
          <Switch
            id="ph-automation-toggle"
            checked={isPhAutomationEnabled}
            onCheckedChange={setIsPhAutomationEnabled}
            aria-label="Toggle pH automation"
          />
        </div>
        {isPhAutomationEnabled ? (
          <p className="text-sm text-green-600 dark:text-green-400">pH balancer is currently active and maintaining optimal levels.</p>
        ) : (
          <p className="text-sm text-muted-foreground">pH automation is currently disabled. pH levels require manual monitoring.</p>
        )}
      </CardContent>
    </Card>
  );
}
