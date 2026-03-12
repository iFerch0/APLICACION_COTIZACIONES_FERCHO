import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cotizaciones y Facturas",
  description: "Sistema para la creación de cotizaciones y facturas profesionales",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <header className="bg-white border-b sticky top-0 z-10 w-full p-4 shadow-sm flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Panel Comercial</h1>
            <nav className="space-x-4">
              <a href="#" className="text-gray-600 hover:text-gray-900">Cotizaciones</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Facturas</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Clientes</a>
            </nav>
          </header>
          <main className="flex-1 p-6 w-full max-w-7xl mx-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
