import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import NavBar from "@/components/layout/NavBar";
import ThemeProvider from "@/components/layout/ThemeProvider";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "CotizaPro — Sistema Comercial",
  description: "Sistema para la creación de cotizaciones y facturas profesionales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${outfit.variable} font-sans antialiased`}>
        <ThemeProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
          <div className="min-h-screen bg-[var(--surface-0)] flex flex-col">
            <NavBar />
            <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8">
              {children}
            </main>
            <footer className="border-t border-[var(--border-0)] px-4 sm:px-10 py-4">
              <div className="max-w-[1400px] mx-auto flex items-center justify-between">
                <span className="text-[var(--text-2)] text-xs">
                  CotizaPro &copy; {new Date().getFullYear()}
                </span>
                <span className="text-[var(--text-2)] text-xs">
                  Validez de cotizaciones: 15 días calendario
                </span>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
