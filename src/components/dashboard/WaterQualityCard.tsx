"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Waves, Beaker } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type WaterQualityCardProps = ComponentProps<typeof Card>;

export function WaterQualityCard({ className, ...props }: WaterQualityCardProps) {
  const waterQualityData = [
    {
      id: "temp",
      label: "Temperature",
      value: "25",
      unit: "°C",
      Icon: Thermometer,
    },
    {
      id: "turbidity",
      label: "Turbidity",
      value: "5",
      unit: "NTU",
      Icon: Waves,
    },
    {
      id: "ph",
      label: "pH Level",
      value: "7.2",
      unit: "", // pH unit is implicit
      Icon: Beaker,
    },
  ];

  return (
    <Card className={cn("shadow-lg", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline">Water Quality</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {waterQualityData.map((param) => (
          <div
            key={param.id}
            className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <param.Icon className="w-10 h-10 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">{param.label}</p>
            <p className="text-2xl font-semibold text-foreground">
              {param.value}
              {param.unit && <span className="text-lg ml-1">{param.unit}</span>}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
