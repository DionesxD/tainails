import type { Metadata, Viewport } from "next";
import { Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "Tainails — Nail Designer & Agendamentos",
  description: "Plataforma de agendamento para a nail designer Tainails. Marque seu horário, experimente cores e acompanhe seus atendimentos.",
  keywords: ["manicure", "nail designer", "agendamento", "esmalte", "unhas", "esmaltação", "tainails"],
  authors: [{ name: "Tainails" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: ["/favicon-32.png"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    title: 'Tainails',
    statusBarStyle: 'default',
    capable: true,
  },
  openGraph: {
    title: "Tainails — Nail Designer & Agendamentos",
    description: "Marque seu horário, experimente cores e acompanhe seus atendimentos.",
    type: "website",
    images: ["/icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6E9EB" },
    { media: "(prefers-color-scheme: dark)", color: "#23151D" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${poppins.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
