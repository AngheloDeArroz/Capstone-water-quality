
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { SystemOverviewCard } from "@/components/dashboard/SystemOverviewCard";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';


export default function RRJAquatiqueDashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  if (loading || !user) {
    return (
      <div className="flex flex-col min-h-screen bg-background p-8">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md shadow-sm mb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto">
          <Skeleton className="h-[600px] w-full rounded-lg" />
        </main>
         <footer className="py-6 border-t mt-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
            <Skeleton className="h-4 w-1/2 mx-auto mb-2" />
            <Skeleton className="h-4 w-1/3 mx-auto" />
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-3xl font-bold text-primary font-headline">
              RRJ Aquatique Dashboard
            </h1>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <SystemOverviewCard />
      </main>

      <footer className="py-6 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>Contact RRJ Aquatique:</p>
          <p>Email: <a href="mailto:contact@rrjaquatique.com" className="text-primary hover:underline">contact@rrjaquatique.com</a> | Phone: +1 (555) 123-4567</p>
          {currentYear && <p className="mt-2">&copy; {currentYear} RRJ Aquatique. All rights reserved.</p>}
        </div>
      </footer>
    </div>
  );
}
