
"use client";

import { useState, type ComponentProps, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Thermometer, Waves, Beaker, Clock, Power, Droplets, Drumstick, FlaskConical, Info, CalendarDays, Brain, AlertTriangle, Loader2, X, WifiOff, FileText, Percent, LineChart as LineChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, subDays, parseISO } from 'date-fns';
import type { HistoryInsightsInput, HistoryInsightsOutput } from '@/ai/flows/history-insights-flow';
import { getHistoryInsights } from '@/ai/flows/history-insights-flow';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, Timestamp, type FirestoreError, onSnapshot } from 'firebase/firestore';
import { HourlyWaterQualityChart } from "./HourlyWaterQualityChart"; // Added import

type SystemOverviewCardProps = ComponentProps<typeof Card>;

interface Schedule {
  id: string;
  time: string;
}

export interface HistoricalEntry {
  date: string;
  waterQuality: {
    temp: string;
    turbidity: string;
    ph: string;
  };
  feedingSchedules: string[]; 
  phBalancerTriggered: boolean;
  isAutoFeedingEnabledToday?: boolean;
  isAutoPhEnabledToday?: boolean;
  foodLevelStartOfDay?: number;
  foodLevelEndOfDay?: number;
  phSolutionLevelStartOfDay?: number;
  phSolutionLevelEndOfDay?: number;
}

interface WaterQualityParam {
  id: "temp" | "turbidity" | "ph";
  label: string;
  value: string;
  unit: string;
  Icon: React.ElementType;
  isLoading?: boolean;
}

const formatTimeFromTimestamp = (timestampInput: unknown): string => {
  if (timestampInput instanceof Timestamp) {
    return format(timestampInput.toDate(), "HH:mm");
  }
  if (typeof timestampInput === 'string') {
    try {
      // Try parsing as ISO in case it's a full date string, then format to time
      const date = parseISO(timestampInput);
      return format(date, "HH:mm");
    } catch (e) {
      // If parsing fails, assume it's already a time string like "08:00"
      return timestampInput;
    }
  }
  return "Invalid time";
};


const generateMockHistoricalData = (): HistoricalEntry[] => {
  const data: HistoricalEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    data.push({
      date: format(date, "PPP"),
      waterQuality: {
        temp: (23 + Math.random() * 4).toFixed(1),
        turbidity: (3 + Math.random() * 5).toFixed(1),
        ph: (6.8 + Math.random() * 0.7).toFixed(1),
      },
      feedingSchedules: Math.random() > 0.3 ?
        (Math.random() > 0.5 ? ["08:00"] : ["08:00", "18:00"]).slice(0, Math.floor(Math.random()*3))
        : [],
      phBalancerTriggered: Math.random() > 0.6,
      isAutoFeedingEnabledToday: Math.random() > 0.5,
      isAutoPhEnabledToday: Math.random() > 0.4,
      foodLevelStartOfDay: Math.floor(60 + Math.random() * 20),
      foodLevelEndOfDay: Math.floor(50 + Math.random() * 10),
      phSolutionLevelStartOfDay: Math.floor(70 + Math.random() * 15),
      phSolutionLevelEndOfDay: Math.floor(65 + Math.random() * 10),
    });
  }
  return data;
};


export function SystemOverviewCard({ className, ...props }: SystemOverviewCardProps) {
  const [waterQualityData, setWaterQualityData] = useState<WaterQualityParam[]>([
    { id: "temp", label: "Temperature", value: "--", unit: "°C", Icon: Thermometer, isLoading: true },
    { id: "turbidity", label: "Turbidity", value: "--", unit: "NTU", Icon: Waves, isLoading: true },
    { id: "ph", label: "pH Level", value: "--", unit: "", Icon: Beaker, isLoading: true },
  ]);
  const [waterQualityError, setWaterQualityError] = useState<string | null>(null);

  const [isAutomatedFeedingEnabled, setIsAutomatedFeedingEnabled] = useState(true);
  const [schedules, setSchedules] = useState<Schedule[]>([
    { id: "schedule1", time: "" },
    { id: "schedule2", time: "" },
  ]);
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);

  const [isPhAutomationEnabled, setIsPhAutomationEnabled] = useState(false);

  const foodLevel = 75;
  const phSolutionLevel = 50;

  const [historicalData, setHistoricalData] = useState<HistoricalEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  const [aiInsights, setAiInsights] = useState<HistoryInsightsOutput | null>(null);
  const [isLoadingAiInsights, setIsLoadingAiInsights] = useState(false);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setWaterQualityError("Firebase not configured. Displaying mock data.");
      setWaterQualityData(prev => prev.map(p => ({ ...p, value: (Math.random() * 10).toFixed(1), isLoading: false })));
      return;
    }
    setWaterQualityError(null);
    setWaterQualityData(prev => prev.map(p => ({ ...p, isLoading: true })));
    const docRef = doc(db, "current-water-quality", "live");

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWaterQualityData([
          { id: "temp", label: "Temperature", value: data.temperature?.toFixed(1) || "--", unit: "°C", Icon: Thermometer, isLoading: false },
          { id: "turbidity", label: "Turbidity", value: data.turbidity?.toFixed(1) || "--", unit: "NTU", Icon: Waves, isLoading: false },
          { id: "ph", label: "pH Level", value: data.ph?.toFixed(1) || "--", unit: "", Icon: Beaker, isLoading: false },
        ]);
        setWaterQualityError(null);
      } else {
        setWaterQualityError("Live water quality data not found in the database.");
        setWaterQualityData(prev => prev.map(p => ({ ...p, value: "N/A", isLoading: false })));
      }
    }, (error) => {
      console.error("Error listening to current water quality:", error);
      const firestoreError = error as FirestoreError;
      let message = "Failed to fetch live data. Using placeholders.";
      if (firestoreError.code === 'unavailable') {
        message = "You are offline. Showing last available data or placeholders for live stats.";
      }
      setWaterQualityError(message);
      setWaterQualityData(prev => prev.map(p => ({ ...p, value: "Err", isLoading: false })));
    });
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!db) {
        setHistoryError("Firebase not configured. Displaying mock historical data.");
        setHistoricalData(generateMockHistoricalData());
        setIsHistoryLoading(false);
        return;
      }
      try {
        setHistoryError(null);
        setIsHistoryLoading(true);
        const historyCollectionRef = collection(db, "water-history");
        const q = query(historyCollectionRef, orderBy("timestamp", "desc"), limit(7));
        const querySnapshot = await getDocs(q);
        
        const fetchedEntries: HistoricalEntry[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const date = data.timestamp && data.timestamp.toDate ? format(data.timestamp.toDate(), "PPP") : "Invalid Date";
          
          let formattedFeedingSchedules: string[] = [];
          if (Array.isArray(data.feedingSchedules)) {
            formattedFeedingSchedules = data.feedingSchedules.map(formatTimeFromTimestamp);
          }

          fetchedEntries.push({
            date: date,
            waterQuality: {
              temp: data.temp?.toString() || "N/A",
              turbidity: data.turbidity?.toString() || "N/A",
              ph: data.ph?.toString() || "N/A",
            },
            feedingSchedules: formattedFeedingSchedules,
            phBalancerTriggered: data.phBalancerTriggered || false,
            isAutoFeedingEnabledToday: data.isAutoFeedingEnabledToday,
            isAutoPhEnabledToday: data.isAutoPhEnabledToday,
            foodLevelStartOfDay: data.foodLevelStartOfDay,
            foodLevelEndOfDay: data.foodLevelEndOfDay,
            phSolutionLevelStartOfDay: data.phSolutionLevelStartOfDay,
            phSolutionLevelEndOfDay: data.phSolutionLevelEndOfDay,
          });
        });

        if (fetchedEntries.length > 0) {
          setHistoricalData(fetchedEntries.reverse()); 
        } else {
          setHistoryError("No historical data found. Displaying mock data.");
          setHistoricalData(generateMockHistoricalData());
        }
      } catch (error) {
        console.error("Error fetching historical data:", error);
        const firestoreError = error as FirestoreError;
        let message = "Failed to fetch history. Displaying mock data.";
        if (firestoreError.code === 'unavailable') {
            message = "You are offline. Historical data could not be fetched. Displaying mock data.";
        }
        setHistoryError(message);
        setHistoricalData(generateMockHistoricalData());
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchHistoricalData();
  }, []);

  const fetchAiInsights = useCallback(async () => {
    if (!historicalData.length || isHistoryLoading) return;

    setIsLoadingAiInsights(true);
    setAiInsights(null);
    setAiInsightsError(null);

    try {
      const input: HistoryInsightsInput = {
        historicalData, 
        currentFoodLevel: foodLevel,
        currentPhSolutionLevel: phSolutionLevel,
      };
      const insights = await getHistoryInsights(input);
      setAiInsights(insights);
    } catch (error) {
      console.error("Error fetching AI insights:", error);
      setAiInsightsError(error instanceof Error ? error.message : "An unknown error occurred while fetching AI insights.");
    } finally {
      setIsLoadingAiInsights(false);
    }
  }, [historicalData, foodLevel, phSolutionLevel, isHistoryLoading]);

  useEffect(() => {
    if (isHistoryDialogOpen && historicalData.length > 0 && !aiInsights && !isLoadingAiInsights && !aiInsightsError && !isHistoryLoading) {
      fetchAiInsights();
    }
  }, [isHistoryDialogOpen, historicalData, aiInsights, isLoadingAiInsights, aiInsightsError, fetchAiInsights, isHistoryLoading]);


  const handleScheduleTimeChange = (id: string, newTime: string) => {
    setSchedules(prevSchedules =>
      prevSchedules.map(sch =>
        sch.id === id ? { ...sch, time: newTime } : sch
      )
    );
  };

  const handleRemoveScheduleTime = (id: string) => {
    setSchedules(prevSchedules =>
      prevSchedules.map(sch =>
        sch.id === id ? { ...sch, time: "" } : sch
      )
    );
    if (editingScheduleId === id) {
      setEditingScheduleId(null); 
    }
  };

  const renderStatus = (status: boolean | undefined) => {
    if (status === undefined) return <span className="text-muted-foreground/70 italic">N/A</span>;
    return status ? <span className="text-green-600 dark:text-green-400">Enabled</span> : <span className="text-red-600 dark:text-red-400">Disabled</span>;
  };

  const renderContainerLevel = (start?: number, end?: number) => {
    if (start === undefined && end === undefined) return <span className="text-muted-foreground/70 italic">N/A</span>;
    let text = "";
    if (start !== undefined) text += `Start: ${start}%`;
    if (end !== undefined) text += `${start !== undefined ? ', ' : ''}End: ${end}%`;
    return text;
  };


  return (
    <Card className={cn("shadow-lg w-full", className)} {...props}>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">System Overview</CardTitle>
        <CardDescription>Comprehensive monitoring and control for your aquatic environment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <section aria-labelledby="water-quality-heading">
          <h3 id="water-quality-heading" className="text-xl font-semibold mb-4 flex items-center text-foreground">
            <Info className="w-6 h-6 mr-3 text-primary" /> Water Quality Status
          </h3>
          {waterQualityError && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm flex items-center gap-2">
              <WifiOff className="w-5 h-5"/> {waterQualityError}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {waterQualityData.map((param) => (
              <div
                key={param.id}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <param.Icon className="w-10 h-10 text-primary mb-2" />
                <p className="text-sm text-muted-foreground">{param.label}</p>
                {param.isLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-foreground">
                    {param.value}
                    {param.unit && <span className="text-lg ml-1">{param.unit}</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <Separator />

        <section aria-labelledby="hourly-trends-heading">
          <h3 id="hourly-trends-heading" className="text-xl font-semibold mb-4 flex items-center text-foreground">
            <LineChartIcon className="w-6 h-6 mr-3 text-primary"/> Hourly Water Quality Trends
          </h3>
          <HourlyWaterQualityChart />
        </section>

        <Separator />

        <section aria-labelledby="automated-feeding-heading">
          <h3 id="automated-feeding-heading" className="text-xl font-semibold mb-4 flex items-center text-foreground">
            <Clock className="w-6 h-6 mr-3 text-primary"/> Automated Feeding
          </h3>
          <div className="space-y-6">
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
                <h4 className="text-md font-medium text-foreground">Set Feeding Times:</h4>
                {schedules.map((schedule, index) => (
                  <div key={schedule.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg border bg-card space-y-3 sm:space-y-0">
                    <div className="flex items-center gap-3 flex-grow">
                      <Label htmlFor={`schedule-time-display-${schedule.id}`} className="font-medium text-foreground whitespace-nowrap">
                        Feeding {index + 1}:
                      </Label>
                      {editingScheduleId === schedule.id ? (
                        <Input
                          type="time"
                          id={`schedule-time-${schedule.id}`}
                          value={schedule.time}
                          onBlur={() => setEditingScheduleId(null)}
                          onChange={(e) => handleScheduleTimeChange(schedule.id, e.target.value)}
                          className="max-w-[150px] sm:max-w-[120px]"
                          aria-label={`Set time for feeding ${index + 1}`}
                          disabled={!isAutomatedFeedingEnabled}
                          autoFocus
                        />
                      ) : (
                        <Button
                          id={`schedule-time-display-${schedule.id}`}
                          variant="ghost"
                          className={cn(
                            "font-normal",
                            !schedule.time && "text-muted-foreground italic",
                            !isAutomatedFeedingEnabled && "text-muted-foreground/70"
                          )}
                          onClick={() => {
                            if (!isAutomatedFeedingEnabled) return;
                            setEditingScheduleId(schedule.id);
                          }}
                          disabled={!isAutomatedFeedingEnabled}
                          aria-label={schedule.time ? `Change time for feeding ${index + 1}, currently ${schedule.time}` : `Set time for feeding ${index + 1}`}
                        >
                          {schedule.time || "No time set"}
                        </Button>
                      )}
                    </div>
                    {schedule.time && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveScheduleTime(schedule.id)}
                        disabled={!isAutomatedFeedingEnabled}
                        aria-label={`Remove time for feeding ${index + 1}`}
                        className="sm:ml-2 mt-2 sm:mt-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {!isAutomatedFeedingEnabled && (
              <p className="text-sm text-muted-foreground text-center py-4">Automated feeding is currently disabled.</p>
            )}
          </div>
        </section>

        <Separator />

        <section aria-labelledby="ph-balancer-heading">
          <h3 id="ph-balancer-heading" className="text-xl font-semibold mb-4 flex items-center text-foreground">
            <Droplets className="w-6 h-6 mr-3 text-primary"/>Automated pH Balancer
          </h3>
          <div className="space-y-4">
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
          </div>
        </section>

        <Separator />

        <section aria-labelledby="container-levels-heading">
          <h3 id="container-levels-heading" className="text-xl font-semibold mb-4 flex items-center text-foreground">
            <Drumstick className="w-6 h-6 mr-3 text-primary" /> Container Levels
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground flex items-center">
                  <Drumstick className="w-5 h-5 mr-2 text-primary/80" />
                  Food Container
                </p>
                <p className="text-sm text-muted-foreground">{foodLevel}%</p>
              </div>
              <Progress value={foodLevel} aria-label={`Food container level: ${foodLevel}%`} className="h-3 [&>div]:bg-accent" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground flex items-center">
                  <FlaskConical className="w-5 h-5 mr-2 text-primary/80" />
                  pH Solution Container
                </p>
                <p className="text-sm text-muted-foreground">{phSolutionLevel}%</p>
              </div>
              <Progress value={phSolutionLevel} aria-label={`pH solution container level: ${phSolutionLevel}%`} className="h-3 [&>div]:bg-accent" />
            </div>
          </div>
        </section>

        <Separator />

        <section aria-labelledby="system-history-heading">
          <h3 id="system-history-heading" className="text-xl font-semibold mb-4 flex items-center text-foreground">
            <CalendarDays className="w-6 h-6 mr-3 text-primary" /> System History & AI Insights
          </h3>
          <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                View Daily Logs & AI Insights
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="text-2xl">System Logs & AI Insights (Last 7 Days)</DialogTitle>
                <DialogDescription>
                  Detailed daily logs and AI-driven recommendations.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh]">
                <ScrollArea className="h-[65vh] pr-4 md:h-auto">
                  <h4 className="text-lg font-semibold mb-3 sticky top-0 bg-background py-2 flex items-center gap-2">
                     <FileText className="w-5 h-5 text-primary"/> Daily Logs
                  </h4>
                  {isHistoryLoading && (
                    <div className="space-y-4 py-2">
                      {[...Array(3)].map((_, i) => (
                        <Card key={i} className="shadow-md">
                          <CardHeader className="py-3 px-4"><Skeleton className="h-5 w-1/2" /></CardHeader>
                          <CardContent className="space-y-2 py-3 px-4 text-sm">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  {historyError && !isHistoryLoading && (
                     <div className="my-4 p-3 rounded-md bg-destructive/10 border border-destructive text-destructive text-sm flex items-center gap-2">
                        <WifiOff className="w-5 h-5"/> {historyError}
                     </div>
                  )}
                  {!isHistoryLoading && !historyError && historicalData.length > 0 && (
                    <div className="space-y-4 py-2">
                      {historicalData.map((entry) => (
                      <Card key={entry.date} className="shadow-md">
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-md font-headline">{entry.date}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 py-3 px-4 text-sm">
                          <div>
                            <h5 className="text-xs font-semibold mb-1 text-muted-foreground">Water Quality:</h5>
                            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                              <li>Temp: {entry.waterQuality.temp}°C</li>
                              <li>Turbidity: {entry.waterQuality.turbidity} NTU</li>
                              <li>pH: {entry.waterQuality.ph}</li>
                            </ul>
                          </div>
                           <div>
                            <h5 className="text-xs font-semibold mb-1 text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/>Feeding:</h5>
                            <p className="text-xs text-muted-foreground">
                              System Status: {renderStatus(entry.isAutoFeedingEnabledToday)}
                            </p>
                            {entry.feedingSchedules.length > 0 ? (
                              <p className="text-xs text-muted-foreground">Fed at: {entry.feedingSchedules.join(', ')}</p>
                            ) : (
                              <p className="text-xs text-muted-foreground italic">No automated feeding triggered.</p>
                            )}
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold mb-1 text-muted-foreground flex items-center gap-1"><Droplets className="w-3 h-3"/>pH Balancer:</h5>
                             <p className="text-xs text-muted-foreground">
                              System Status: {renderStatus(entry.isAutoPhEnabledToday)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Activity: {entry.phBalancerTriggered ? <span className="text-accent">Triggered</span> : "Not Triggered"}
                            </p>
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold mb-1 text-muted-foreground flex items-center gap-1"><Percent className="w-3 h-3"/>Container Levels:</h5>
                            <p className="text-xs text-muted-foreground">Food: {renderContainerLevel(entry.foodLevelStartOfDay, entry.foodLevelEndOfDay)}</p>
                            <p className="text-xs text-muted-foreground">pH Solution: {renderContainerLevel(entry.phSolutionLevelStartOfDay, entry.phSolutionLevelEndOfDay)}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    </div>
                  )}
                  {!isHistoryLoading && !historyError && historicalData.length === 0 && (
                     <p className="text-center text-muted-foreground py-10">No historical data available.</p>
                  )}
                </ScrollArea>

                <ScrollArea className="h-[65vh] pr-4 md:h-auto">
                   <h4 className="text-lg font-semibold mb-3 flex items-center sticky top-0 bg-background py-2">
                    <Brain className="w-5 h-5 mr-2 text-primary" /> AI-Powered Insights
                  </h4>
                  <div className="space-y-4 py-2">
                    {isLoadingAiInsights && (
                      <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="w-8 h-8 mr-2 animate-spin text-primary" />
                        Generating insights...
                      </div>
                    )}
                    {aiInsightsError && !isLoadingAiInsights && (
                      <Card className="bg-destructive/10 border-destructive">
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-destructive text-md flex items-center">
                            <AlertTriangle className="w-5 h-5 mr-2" /> Error
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-3 px-4 text-sm text-destructive">
                          <p>{aiInsightsError}</p>
                          <Button variant="link" onClick={fetchAiInsights} className="p-0 h-auto mt-2 text-destructive">Try again</Button>
                        </CardContent>
                      </Card>
                    )}
                    {aiInsights && !isLoadingAiInsights && !aiInsightsError && (
                      <div className="space-y-4">
                        <Card>
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-md">Recommended Actions</CardTitle>
                          </CardHeader>
                          <CardContent className="py-3 px-4 text-sm">
                            {aiInsights.recommendedActions.length > 0 ? (
                              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                {aiInsights.recommendedActions.map((action, index) => (
                                  <li key={index}>{action}</li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted-foreground">No specific actions recommended at this time.</p>
                            )}
                          </CardContent>
                        </Card>
                        <Card>
                           <CardHeader className="py-3 px-4">
                            <CardTitle className="text-md">Container Level Estimates</CardTitle>
                          </CardHeader>
                          <CardContent className="py-3 px-4 text-sm space-y-2">
                            <p><strong className="text-foreground">Food Container Empty:</strong> <span className="text-muted-foreground">{aiInsights.estimatedFoodEmptyDate}</span></p>
                            <p><strong className="text-foreground">pH Solution Empty:</strong> <span className="text-muted-foreground">{aiInsights.estimatedPhSolutionEmptyDate}</span></p>
                          </CardContent>
                        </Card>
                         <Button variant="outline" size="sm" onClick={fetchAiInsights} className="w-full" disabled={isHistoryLoading || isLoadingAiInsights}>
                            <Brain className="w-4 h-4 mr-2"/> Regenerate Insights
                        </Button>
                      </div>
                    )}
                    {!aiInsights && !isLoadingAiInsights && !aiInsightsError && (isHistoryLoading || historicalData.length === 0) && !historyError && (
                        <p className="text-center text-muted-foreground py-10">
                            {isHistoryLoading ? "Loading history before generating insights..." : "Historical data needed for insights."}
                        </p>
                    )}
                    {!aiInsights && !isLoadingAiInsights && !aiInsightsError && !isHistoryLoading && historicalData.length > 0 && (
                         <div className="text-center py-10">
                            <p className="text-muted-foreground mb-4">Click the button to get AI-powered insights based on the current history.</p>
                            <Button onClick={fetchAiInsights} disabled={isLoadingAiInsights || isHistoryLoading}>
                                <Brain className="w-4 h-4 mr-2"/> Get AI Insights
                            </Button>
                        </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

      </CardContent>
    </Card>
  );
}

