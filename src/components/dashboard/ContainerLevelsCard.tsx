"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Drumstick, FlaskConical } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type ContainerLevelsCardProps = ComponentProps<typeof Card>;

export function ContainerLevelsCard({ className, ...props }: ContainerLevelsCardProps) {
  const foodLevel = 75; // Placeholder percentage
  const phSolutionLevel = 50; // Placeholder percentage

  return (
    <Card className={cn("shadow-lg", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline">Container Levels</CardTitle>
        <CardDescription>Monitor the levels of your consumables.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-foreground flex items-center">
              <Drumstick className="w-5 h-5 mr-2 text-primary" />
              Food Container
            </p>
            <p className="text-sm text-muted-foreground">{foodLevel}%</p>
          </div>
          <Progress value={foodLevel} aria-label={`Food container level: ${foodLevel}%`} className="h-3 [&>div]:bg-accent" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-foreground flex items-center">
              <FlaskConical className="w-5 h-5 mr-2 text-primary" />
              pH Solution Container
            </p>
            <p className="text-sm text-muted-foreground">{phSolutionLevel}%</p>
          </div>
          <Progress value={phSolutionLevel} aria-label={`pH solution container level: ${phSolutionLevel}%`} className="h-3 [&>div]:bg-accent" />
        </div>
      </CardContent>
    </Card>
  );
}
