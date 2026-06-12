import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { ThemeProvider } from "@/components/theme-provider";
import { GlobalErrorBoundary } from "@/components/error-boundary";
import { preloadAvatarModel } from "@ikiraro/renderer";
import appCss from "../index.css?url";

preloadAvatarModel("/models/avatar.glb");

export interface RouterAppContext {}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      // Standard Metadata
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Ikiraro Bridge" },
      {
        name: "description",
        content: "Accessible Communication.",
      },
      {
        name: "keywords",
        content:
          "Ikiraro Bridge, sign language translation, ASL, accessibility, deaf communication, text to sign, speech to sign, 3D avatar, sign planning, accessible communication, deaf, hard of hearing, sign language app",
      },

      // Theme & Browser Config
      { name: "theme-color", content: "#EDEBE5" },
      { name: "msapplication-TileColor", content: "#EDEBE5" },
      { name: "msapplication-config", content: "/browserconfig.xml" },

      // Open Graph
      { property: "og:title", content: "Ikiraro Bridge" },
      { property: "og:description", content: "Accessible Communication." },
      { property: "og:type", content: "website" },

      // Twitter
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Ikiraro Bridge" },
      { name: "twitter:description", content: "Accessible Communication." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "16x16",
        href: "/favicon-16x16.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "48x48",
        href: "/favicon-48x48.png",
      },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      { rel: "manifest", href: "/manifest.json" },
    ],
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
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Skip to content
        </a>
        <GlobalErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex min-h-svh flex-col">
              <main id="main-content" className="flex-1 outline-none" tabIndex={-1}>
                <Outlet />
              </main>
            </div>

            <TanStackRouterDevtools position="bottom-left" />
          </ThemeProvider>
          <Scripts />
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
