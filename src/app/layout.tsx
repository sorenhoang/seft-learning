import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import Header from "@/components/layout/Header";
import FooterQuote from "@/components/layout/FooterQuote";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    template: "%s | Soren Learning",
    default: "Soren Learning",
  },
  description:
    "Personal knowledge base — technical notes, product thinking, design, and growth.",
  openGraph: {
    siteName: "Soren Learning",
    images: [{ url: "/api/og?title=Knowledge+Base&type=page", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Prevent flash of wrong theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.add('light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-100 py-6 dark:border-zinc-800">
          <FooterQuote />
        </footer>
      </body>
    </html>
  );
}
