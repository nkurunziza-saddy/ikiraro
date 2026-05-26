import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { GlobalErrorBoundary } from "@/components/error-boundary";
import { preloadAvatarModel } from "@ikiraro/renderer";
import Header from "../components/header";
import appCss from "../index.css?url";

preloadAvatarModel("/models/avatar.glb");

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ikiraro Bridge — Accessible Communication" },
      {
        name: "description",
        content: "A translation console for speech, text, and sign planning.",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootDocument,
});
function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="overflow-x-hidden">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-bold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Skip to content
        </a>
        <GlobalErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-svh flex-col">
              <Header />
              <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
                <Outlet />
              </main>
            </div>
            <Toaster richColors />
            <TanStackRouterDevtools position="bottom-left" />
          </ThemeProvider>
          <Scripts />
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
