import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/fireguard/auth";
import { useState } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "FireGuard — Gestão e Inspeção de Extintores" },
      { name: "description", content: "Sistema corporativo de gestão, inspeção e conformidade de extintores de incêndio (NR-23)." },
      { property: "og:title", content: "FireGuard — Gestão e Inspeção de Extintores" },
      { property: "og:description", content: "Sistema corporativo de gestão, inspeção e conformidade de extintores de incêndio (NR-23)." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "FireGuard — Gestão e Inspeção de Extintores" },
      { name: "twitter:description", content: "Sistema corporativo de gestão, inspeção e conformidade de extintores de incêndio (NR-23)." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/de453641-bd54-4720-b325-cfe20de0dcbc/id-preview-c4fad11a--f2650539-6304-4ba8-9ec6-aba0f161b6ac.lovable.app-1778018642542.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/de453641-bd54-4720-b325-cfe20de0dcbc/id-preview-c4fad11a--f2650539-6304-4ba8-9ec6-aba0f161b6ac.lovable.app-1778018642542.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  // Inline, synchronous theme bootstrap to avoid FOUC / flicker.
  // Reads localStorage prefs BEFORE first paint and applies .dark only if user opted in.
  const themeBootstrap = `(function(){try{var r=document.documentElement;r.classList.remove('dark');var raw=localStorage.getItem('fireguard:prefs');if(raw){var p=JSON.parse(raw);if(p&&p.darkMode===true){r.classList.add('dark');}}}catch(e){}})();`;
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } } }));
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}
