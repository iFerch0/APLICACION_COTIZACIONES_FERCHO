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
          <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-solid border-slate-200 dark:border-slate-800 px-6 lg:px-10 py-4">
            <div className="max-w-[1280px] mx-auto flex items-center justify-between whitespace-nowrap">
              <div className="flex items-center gap-4">
                <div className="bg-[#24aceb]/10 p-2 rounded-lg text-[#24aceb] flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <h2 className="text-slate-900 dark:text-slate-100 text-xl font-bold leading-tight tracking-tight">Crear Cotización</h2>
              </div>
              <div className="flex gap-3">
                <button className="flex min-w-[100px] cursor-pointer items-center justify-center rounded-lg h-10 px-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-bold transition-colors hover:bg-slate-200">
                  <span>Cancelar</span>
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 lg:px-10 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
