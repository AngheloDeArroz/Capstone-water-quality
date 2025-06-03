
"use client";

import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, WifiOff, Loader2 } from "lucide-react";
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, Timestamp, type FirestoreError, onSnapshot } from 'firebase/firestore';
import { format, subHours } from 'date-fns';
import { cn } from "@/lib/utils";

interface HourlyDataPoint {
  timestamp: Timestamp; // Firestore Timestamp
  timeLabel: string;    // Formatted time string for X-axis
  temperature?: number;
  ph?: number;
  turbidity?: number;
}

const chartConfig = {
  temperature: {
    label: "Temp (°C)",
    color: "hsl(var(--chart-1))",
  },
  ph: {
    label: "pH",
    color: "hsl(var(--chart-2))",
  },
  turbidity: {
    label: "Turbidity (NTU)",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

const generateMockHourlyData = (): HourlyDataPoint[] => {
  const data: HourlyDataPoint[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hourTimestamp = subHours(now, i);
    data.push({
      timestamp: Timestamp.fromDate(hourTimestamp),
      timeLabel: format(hourTimestamp, "HH:mm"),
      temperature: parseFloat((24 + Math.random() * 3).toFixed(1)),
      ph: parseFloat((6.8 + Math.random() * 0.5).toFixed(1)),
      turbidity: parseFloat((3 + Math.random() * 10).toFixed(1)),
    });
  }
  return data;
};

type HourlyWaterQualityChartProps = ComponentProps<typeof Card> & {
  // You can add specific props if needed
};

export function HourlyWaterQualityChart({ className, ...props }: HourlyWaterQualityChartProps) {
  const [chartData, setChartData] = useState<HourlyDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError("Firebase not configured. Displaying mock data.");
      setChartData(generateMockHourlyData());
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    const historyCollectionRef = collection(db, "hourly-water-quality");
    const q = query(historyCollectionRef, orderBy("timestamp", "desc"), limit(24));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedEntries: HourlyDataPoint[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const ts = data.timestamp as Timestamp; 
        fetchedEntries.push({
          timestamp: ts,
          timeLabel: ts ? format(ts.toDate(), "HH:mm") : "N/A",
          temperature: data.temperature,
          ph: data.ph,
          turbidity: data.turbidity,
        });
      });

      if (fetchedEntries.length > 0) {
        setChartData(fetchedEntries.reverse()); // Reverse to show oldest to newest
        setError(null); // Clear previous errors if data is successfully fetched
      } else {
        setError("No hourly data found for the last 24 hours. Displaying mock data.");
        setChartData(generateMockHourlyData());
      }
      setIsLoading(false);
    }, (e) => {
      console.error("Error fetching hourly water quality data:", e);
      const firestoreError = e as FirestoreError;
      let message = "Failed to fetch hourly data. Displaying mock data.";
      if (firestoreError.code === 'unavailable') {
          message = "You are offline. Hourly data updates may be delayed. Displaying mock data if cache is empty.";
      } else if (firestoreError.code === 'permission-denied') {
          message = "Permission denied to fetch hourly data. Please check Firestore rules. Displaying mock data.";
      }
      setError(message);
      // Keep existing data if any, otherwise show mock data
      if (chartData.length === 0) {
        setChartData(generateMockHourlyData());
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // chartData removed from dependency array to prevent re-subscription on data change

  if (isLoading && chartData.length === 0) { // Only show main loader if truly initial loading
    return (
      <Card className={cn("shadow-md", className)} {...props}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("shadow-md", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline">Hourly Trends</CardTitle>
        <CardDescription>Temperature, pH, and Turbidity over the last 24 hours. (Live)</CardDescription>
      </CardHeader>
      <CardContent>
        {error && chartData.every(d => d.temperature === undefined) && ( // Show error prominently if mock data is the only thing shown due to error
          <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm flex items-center gap-2">
            {error.includes("offline") ? <WifiOff className="w-5 h-5"/> : <AlertTriangle className="w-5 h-5"/>}
            {error}
          </div>
        )}
        {/* Minor loading indicator for updates, not for initial load if data already exists */}
        {isLoading && chartData.length > 0 && (
            <div className="absolute top-4 right-4 text-xs text-muted-foreground flex items-center">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Updating...
            </div>
        )}
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: -20, 
                bottom: 5,
              }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="timeLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value} 
                interval="preserveStartEnd" 
                minTickGap={30} 
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={true}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Legend contentStyleType={{fontSize: '0.8rem'}} wrapperStyle={{paddingTop: '10px'}}/>
              <Line
                dataKey="temperature"
                type="monotone"
                stroke="var(--color-temperature)"
                strokeWidth={2}
                dot={false}
                name="Temp (°C)"
                connectNulls // Connect line even if some data points are missing
              />
              <Line
                dataKey="ph"
                type="monotone"
                stroke="var(--color-ph)"
                strokeWidth={2}
                dot={false}
                name="pH"
                connectNulls
              />
              <Line
                dataKey="turbidity"
                type="monotone"
                stroke="var(--color-turbidity)"
                strokeWidth={2}
                dot={false}
                name="Turbidity (NTU)"
                connectNulls
              />
            </LineChart>
          </ChartContainer>
        ) : (
          !isLoading && <p className="text-center text-muted-foreground py-10">Insufficient data to display chart. Waiting for incoming hourly data...</p>
        )}
      </CardContent>
    </Card>
  );
}
