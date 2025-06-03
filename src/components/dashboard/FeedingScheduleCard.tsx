"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Clock, Power } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type FeedingScheduleCardProps = ComponentProps<typeof Card>;

export function FeedingScheduleCard({ className, ...props }: FeedingScheduleCardProps) {
  const [isAutomatedFeedingEnabled, setIsAutomatedFeedingEnabled] = useState(true);

  const schedules = [
    { id: 1, startTime: "08:00 AM", endTime: "08:05 AM" },
    { id: 2, startTime: "06:00 PM", endTime: "06:05 PM" },
  ];

  return (
    <Card className={cn("shadow-lg", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
           <Clock className="w-6 h-6 text-primary"/> Automated Feeding
        </CardTitle>
        <CardDescription>Manage your automated fish feeding schedules.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
          <Label htmlFor="automated-feeding-toggle" className="flex items-center gap-2 text-base font-medium text-foreground">
            <Power className="w-5 h-5 text-primary" />
            Enable Automated Feeding
          </Label>
          <Switch
            id="automated-feeding-toggle"
            checked={isAutomatedFeedingEnabled}
            onCheckedChange={setIsAutomatedFeedingEnabled}
            aria-label="Toggle automated feeding"
          />
        </div>
        
        {isAutomatedFeedingEnabled && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-foreground">Active Schedules:</h4>
            {schedules.map((schedule, index) => (
              <div key={schedule.id}>
                <div className="flex justify-between items-center p-3 rounded-lg border bg-card hover:bg-secondary/20 transition-colors">
                  <p className="font-medium text-foreground">Schedule {schedule.id}</p>
                  <p className="text-sm text-muted-foreground">{schedule.startTime} - {schedule.endTime}</p>
                </div>
                {index < schedules.length - 1 && <Separator className="my-3"/>}
              </div>
            ))}
          </div>
        )}
         {!isAutomatedFeedingEnabled && (
          <p className="text-sm text-muted-foreground text-center py-4">Automated feeding is currently disabled.</p>
        )}
      </CardContent>
    </Card>
  );
}
