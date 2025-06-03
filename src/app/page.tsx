
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search as SearchIcon } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  price: string;
}

const fallbackProducts: Product[] = [
  { id: '1', name: 'Neon Tetra', description: 'Vibrant and schooling, perfect for community tanks.', imageUrl: 'https://placehold.co/400x300.png', imageHint: 'neon tetra fish', price: '$2.99' },
  { id: '2', name: 'Aquarium Filter X200', description: 'High-performance filter for crystal clear water.', imageUrl: 'https://placehold.co/400x300.png', imageHint: 'aquarium filter', price: '$49.99' },
  { id: '3', name: 'Premium Fish Flakes', description: 'Nutritious daily diet for all tropical fish.', imageUrl: 'https://placehold.co/400x300.png', imageHint: 'fish food', price: '$9.99' },
  { id: '4', name: 'Natural Driftwood Piece', description: 'Unique, natural driftwood to enhance your aquascape.', imageUrl: 'https://placehold.co/400x300.png', imageHint: 'aquarium driftwood', price: '$19.99' },
  { id: '5', name: 'Male Crowntail Betta', description: 'Stunning Betta fish with elaborate finnage.', imageUrl: 'https://placehold.co/400x300.png', imageHint: 'betta fish', price: '$15.00' },
  { id: '6', name: 'LED Aquarium Light Bar', description: 'Bright and energy-efficient lighting for plant growth.', imageUrl: 'https://placehold.co/400x300.png', imageHint: 'aquarium light', price: '$34.99' },
];


export default function LandingPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [displayedProducts, setDisplayedProducts] = useState<Product[]>(fallbackProducts);

  useEffect(() => {
    if (searchTerm === '') {
      setDisplayedProducts(fallbackProducts);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      const filtered = fallbackProducts.filter(product =>
        product.name.toLowerCase().includes(lowercasedFilter) ||
        product.description.toLowerCase().includes(lowercasedFilter)
      );
      setDisplayedProducts(filtered);
    }
  }, [searchTerm]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-blue-100 dark:to-blue-900">
      <header className="py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="RRJ Aquatique Logo"
              width={48}
              height={48}
              className="rounded-full"
              data-ai-hint="company logo"
            />
            <h1 className="text-4xl font-bold text-primary font-headline">
              RRJ Aquatique
            </h1>
          </div>
          <Button onClick={() => router.push("/login")} variant="outline">
            Login
          </Button>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <div className="max-w-3xl mt-8 mb-12">
          <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Your Premier Destination for Ornamental Fish & Aquatic Supplies
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Dive into a world of aquatic wonder! RRJ Aquatique offers a curated selection of vibrant ornamental fish, top-quality pet supplies, and all the essential accessories to help you create and maintain your stunning aquarium.
          </p>
          
          <div className="flex w-full max-w-xl mx-auto mb-12">
            <Input
              type="search"
              placeholder="Search for fish, food, accessories..."
              className="rounded-r-none focus:ring-primary focus:border-primary text-base h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="button" className="rounded-l-none h-12 px-6">
              <SearchIcon className="mr-2 h-5 w-5" /> Search
            </Button>
          </div>
        </div>

        <div className="mb-16 w-full max-w-5xl">
          <Image
            src="https://placehold.co/1200x500.png"
            alt="Beautiful ornamental fish and aquarium supplies"
            width={1200}
            height={500}
            className="rounded-xl shadow-2xl"
            data-ai-hint="ornamental fish aquarium"
            priority
          />
        </div>

        <section className="w-full mb-16">
          <h3 className="text-3xl font-bold text-foreground mb-10">Our Featured Products</h3>
          
          {displayedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedProducts.map((product) => (
                <Card key={product.id} className="text-left shadow-xl hover:shadow-2xl transition-shadow duration-300 flex flex-col">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    width={400}
                    height={300}
                    className="rounded-t-lg object-cover w-full h-48"
                    data-ai-hint={product.imageHint}
                  />
                  <CardHeader>
                    <CardTitle className="text-xl font-headline">{product.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-muted-foreground text-sm">{product.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center pt-4">
                    <p className="text-lg font-semibold text-primary">{product.price}</p>
                    <Button variant="outline">View Details</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-lg">No products found matching your search criteria.</p>
          )}
        </section>

      </main>

      <footer className="py-6 border-t mt-8 bg-background/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>Contact RRJ Aquatique:</p>
          <p>Email: <a href="mailto:contact@rrjaquatique.com" className="text-primary hover:underline">contact@rrjaquatique.com</a> | Phone: +1 (555) 123-4567</p>
          <p className="mt-2">&copy; {new Date().getFullYear()} RRJ Aquatique. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
