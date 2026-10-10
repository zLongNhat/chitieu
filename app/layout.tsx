import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SwRegister } from "@/components/pwa";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Chi tiêu — Dashboard",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chi tiêu",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1fb" },
    { media: "(prefers-color-scheme: dark)", color: "#141218" },
  ],
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" suppressHydrationWarning className="dark">
      <body className={`${jakarta.variable} min-h-full antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('chitieu-theme')==='light')document.documentElement.classList.remove('dark')}catch(e){document.documentElement.classList.add('dark')}`,
          }}
        />
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
