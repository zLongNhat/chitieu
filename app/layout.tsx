import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Chi tiêu — Dashboard",
  description: "Theo dõi chi tiêu ngày và tháng, biểu đồ realtime, lưu Supabase.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${jakarta.variable} min-h-full antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('chitieu-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
