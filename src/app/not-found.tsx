import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-base px-6">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 -left-1/4 w-[800px] h-[800px] bg-brand-primary/10 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 -right-1/4 w-[800px] h-[800px] bg-brand-secondary/10 rounded-full blur-[120px] -z-10 animate-pulse delay-700" />

      <div className="z-10 max-w-2xl w-full flex flex-col items-center text-center space-y-8 animate-fade-in">
        {/* Error Code */}
        <div className="relative">
          <h2 className="text-[180px] md:text-[220px] font-bold leading-none tracking-normal text-text-primary/10 select-none">
            404
          </h2>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl md:text-5xl font-bold bg-linear-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              Lost in Space?
            </span>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
            The page you're looking for doesn't exist.
          </h1>
          <p className="text-lg text-text-secondary">
            It seems like our AI agents couldn't find the coordinates for this specific page. 
            Don't worry, you can always head back to safe grounds.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-4">
          <Link href="/home">
            <Button className="w-auto px-10 h-14 rounded-2xl">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Suggestion Links */}
        <div className="flex gap-6 pt-8 text-sm font-medium text-text-secondary">
          <Link href="/studio" className="hover:text-brand-primary transition-colors">
            Studio
          </Link>
          <Link href="/templates" className="hover:text-brand-primary transition-colors">
            Templates
          </Link>
          <Link href="/projects" className="hover:text-brand-primary transition-colors">
            Projects
          </Link>
        </div>
      </div>
    </main>
  );
}
