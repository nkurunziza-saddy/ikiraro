import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Footer } from "./footer";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  mainClassName?: string;
}

export function PageLayout({ children, className, mainClassName }: PageLayoutProps) {
  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.25,
        ease: [0.23, 1, 0.32, 1] as any, // Custom ease-out
      }}
      className={cn(
        "min-h-screen bg-background text-[15px] leading-[1.85] tracking-[-0.01em] antialiased text-muted-foreground font-light font-sans selection:bg-foreground selection:text-background flex flex-col",
        className,
      )}
    >
      <main
        className={cn(
          "max-w-[900px] mx-auto px-4 md:px-6 pb-20 md:pb-40 flex-1 w-full",
          mainClassName,
        )}
      >
        {children}
      </main>
      <Footer />
    </motion.article>
  );
}
