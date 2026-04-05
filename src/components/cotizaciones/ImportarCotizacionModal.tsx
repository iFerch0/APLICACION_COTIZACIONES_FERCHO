"use client";

import { useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, FileText, Receipt, AlertTriangle, Loader2, ArrowDownToLine } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getCotizacionesParaImportar,
  getDocumentForConversion,
  ImportedCotizacionData,
  CotizacionParaImportar,
} from "@/app/actions/documents";
import { fmtMoney } from "@/lib/format";

interface Props {
  onImport: (data: ImportedCotizacionData) => void;
  hasFormData: boolean;
}

export default function ImportarCotizacionModal({ onImport, hasFormData }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<CotizacionParaImportar[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null); // confirmación

  // Busca cotizaciones al escribir
  const handleSearch = useCallback(async (q: string) => {
    setSearch(q);
    setLoading(true);
    const data = await getCotizacionesParaImportar(q.trim() || undefined);
    setResults(data);
    setLoading(false);
  }, []);

  // Carga inicial al abrir el modal
  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && results.length === 0) {
      setLoading(true);
      const data = await getCotizacionesParaImportar();
      setResults(data);
      setLoading(false);
    }
    if (!isOpen) {
      setSearch("");
      setPendingId(null);
    }
  };

  // Inicia importación — si hay datos en el form, pide confirmación
  const handleSelectRow = (id: string) => {
    if (hasFormData) {
      setPendingId(id);
    } else {
      doImport(id);
    }
  };

  const doImport = async (id: string) => {
    setImporting(id);
    setPendingId(null);
    const data = await getDocumentForConversion(id);
    if (data) {
      // Asegurar que los items importados tengan los nuevos campos con defaults
      const enrichedData: ImportedCotizacionData = {
        ...data,
        items: data.items.map((item: import("@/lib/calculator").ItemInput) => ({
          ...item,
          tipoItem: item.tipoItem ?? "PRODUCTO",
          fuenteCompra: item.fuenteCompra ?? "LOCAL",
          precioOriginal: item.precioOriginal ?? undefined,
          monedaOriginal: item.monedaOriginal ?? "COP",
          grupoId: item.grupoId ?? undefined,
          grupoLabel: item.grupoLabel ?? undefined,
          aplicaTax: item.aplicaTax ?? false,
          taxUnitario: item.taxUnitario ?? 0,
          envioUnitario: item.envioUnitario ?? 0,
          promocionEnvioUnitario: item.promocionEnvioUnitario ?? 0,
          importacionUnitario: item.importacionUnitario ?? 0,
          aplicaAmazon: item.aplicaAmazon ?? false,
        })),
      };
      onImport(enrichedData);
      setOpen(false);
      setSearch("");
      setResults([]);
    }
    setImporting(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger className="flex items-center gap-2 px-3.5 py-2 bg-teal-400/10 hover:bg-teal-400/20 border border-teal-400/20 text-teal-500 text-xs font-semibold rounded-xl transition-all">
        <ArrowDownToLine className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Importar Cotización</span>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col bg-[var(--surface-1)] border-[var(--border-0)]">
        <DialogHeader>
          <DialogTitle className="text-[var(--text-0)] font-bold flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-400/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-teal-500" />
            </div>
            Importar desde Cotización
          </DialogTitle>
        </DialogHeader>

        {/* Banner de confirmación */}
        {pendingId && (
          <div className="flex items-start gap-3 p-4 bg-amber-400/8 border border-amber-400/20 rounded-xl mx-1">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--text-0)]">
                El formulario ya tiene datos
              </p>
              <p className="text-xs text-[var(--text-2)] mt-0.5 mb-3">
                Al importar esta cotización se reemplazará el cliente e ítems actuales. ¿Continuar?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => doImport(pendingId)}
                  className="px-3.5 py-1.5 bg-teal-400 hover:bg-teal-300 text-[oklch(0.090_0.025_255)] text-xs font-bold rounded-lg transition-all"
                >
                  Sí, importar
                </button>
                <button
                  onClick={() => setPendingId(null)}
                  className="px-3.5 py-1.5 bg-[var(--surface-2)] border border-[var(--border-0)] text-[var(--text-1)] text-xs font-semibold rounded-lg transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Búsqueda */}
        <div className="relative px-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-2)] pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por número (COT-...) o nombre de cliente..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--border-0)] rounded-xl py-2.5 pl-10 pr-4 text-sm text-[var(--text-0)] placeholder-[var(--text-2)] focus:border-teal-400/50 focus:ring-1 focus:ring-teal-400/20 outline-none transition-all"
            autoFocus
          />
        </div>

        {/* Resultados */}
        <div className="flex-1 overflow-y-auto px-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-2 text-[var(--text-2)]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Buscando...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--surface-2)] flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-[var(--text-2)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--text-0)]">Sin cotizaciones</p>
              <p className="text-xs text-[var(--text-2)] mt-1">
                {search ? "No hay resultados para tu búsqueda." : "Aún no tienes cotizaciones guardadas."}
              </p>
            </div>
          ) : (
            <div className="space-y-1 py-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] px-2 pb-1">
                {results.length} cotización{results.length !== 1 ? "es" : ""}
              </p>
              {results.map((cot) => {
                const isImporting = importing === cot.id;
                const isPending = pendingId === cot.id;
                const yaFacturada = cot.facturasCount > 0;

                return (
                  <button
                    key={cot.id}
                    onClick={() => handleSelectRow(cot.id)}
                    disabled={isImporting || !!importing}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      isPending
                        ? "bg-amber-400/8 border-amber-400/25"
                        : "bg-[var(--surface-2)]/50 border-transparent hover:bg-[var(--surface-2)] hover:border-[var(--border-0)]"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        yaFacturada ? "bg-green-400/10" : "bg-amber-400/10"
                      }`}>
                        {isImporting ? (
                          <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
                        ) : (
                          <FileText className={`w-4 h-4 ${yaFacturada ? "text-green-500" : "text-amber-500"}`} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[var(--text-0)]">
                            {cot.numero}
                          </span>
                          {yaFacturada && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-400/10 text-green-600 dark:text-green-400 border border-green-400/20">
                              <Receipt className="w-2.5 h-2.5" />
                              {cot.facturasCount} factura{cot.facturasCount !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--text-1)] truncate">
                          {cot.customer.nombres}
                          {cot.customer.email && (
                            <span className="text-[var(--text-2)]"> · {cot.customer.email}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-[var(--text-0)]">
                        ${fmtMoney(cot.totalFinal)}
                      </div>
                      <div className="text-[10px] text-[var(--text-2)]">
                        {format(new Date(cot.fecha), "dd MMM yy", { locale: es })}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-0)] pt-3 px-1">
          <p className="text-[10px] text-[var(--text-2)] leading-relaxed">
            Al importar, el cliente e ítems del formulario serán reemplazados con los de la cotización seleccionada. Podrás modificarlos antes de guardar.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
