"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Plus, FileText, Eye, CheckCircle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  calcularItem,
  calcularTotalesDocumento,
  aplicarMargenAItem,
} from "@/lib/calculator";
import { fmtMoneyDec } from "@/lib/format";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { createCustomer } from "@/app/actions/customers";
import { saveDocument, updateDocument, ImportedCotizacionData, EditDocumentData } from "@/app/actions/documents";
import ImportarCotizacionModal from "./ImportarCotizacionModal";
import ItemRow from "./ItemRow";
import MargenPanel from "./MargenPanel";
import DocumentTotals from "./DocumentTotals";
import CustomerSelector from "./CustomerSelector";
import type { ItemForm, TipoItem, FuenteCompra, ClienteForm, SavedDoc, MargenTipo, MargenRedondeo } from "./types";
import { makeItem, getItemDefaults, toItemInput } from "./types";

const ClientPDFViewer = dynamic(() => import("@/components/pdf/ClientPDFViewer"), { ssr: false });
const PDFDownloadButton = dynamic(
  () => import("@/components/pdf/ClientPDFViewer").then((m) => ({ default: m.PDFDownloadButton })),
  { ssr: false }
);

// ── Props ─────────────────────────────────────────────────────────────────────
export interface DocumentFormProps {
  tipoDocumento?: "COTIZACION" | "FACTURA";
  seller?: import("@/app/actions/seller").SellerData | null;
  sourceDocument?: ImportedCotizacionData | null;
  editDocument?: EditDocumentData | null;
}

// ── Main Orchestrator ─────────────────────────────────────────────────────────
export default function CotizacionForm({
  tipoDocumento = "COTIZACION",
  seller,
  sourceDocument,
  editDocument,
}: DocumentFormProps) {
  const router = useRouter();
  const initSource = editDocument ?? sourceDocument;
  const isEditMode = !!editDocument;
  const isLabel = tipoDocumento === "COTIZACION" ? "Cotización" : "Factura";

  // ── State ────────────────────────────────────────────────────────────────
  const [clienteInfo, setClienteInfo] = useState<ClienteForm>({
    nombres: initSource?.clienteNombre ?? "",
    email: initSource?.clienteEmail ?? "",
    notas: initSource?.observaciones ?? "",
  });
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initSource?.clienteId ?? null
  );
  const [items, setItems] = useState<ItemForm[]>(() => {
    if (initSource?.items && initSource.items.length > 0) {
      // Mapear ItemInput (calculator) → ItemForm (nuestro tipo)
      return initSource.items.map((i) => ({
        ...i,
        tipoItem: (i as ItemForm).tipoItem ?? "PRODUCTO",
        fuenteCompra: (i as ItemForm).fuenteCompra ?? "LOCAL",
      }));
    }
    return [{ ...makeItem(), id: "1" }];
  });
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [savedDoc, setSavedDoc] = useState<SavedDoc | null>(null);
  const [formatoPDF, setFormatoPDF] = useState<"completo" | "resumido" | "concatenado">("completo");

  // Trazabilidad
  const [cotizacionOrigenId, setCotizacionOrigenId] = useState<string | null>(
    sourceDocument?.cotizacionOrigenId ?? null
  );
  const [cotizacionOrigenNumero, setCotizacionOrigenNumero] = useState<string | null>(
    sourceDocument?.cotizacionNumero ?? null
  );

  // Margen
  const [margenPreset, setMargenPreset] = useState<number | "manual">(0);
  const [margenManual, setMargenManual] = useState(20);
  const [margenTipo, setMargenTipo] = useState<MargenTipo>(editDocument?.margenTipo ?? "base");
  const [margenRedondeo, setMargenRedondeo] = useState<MargenRedondeo>(
    editDocument?.margenRedondeo ?? 0
  );
  const margenPorcentaje = margenPreset === "manual" ? margenManual : margenPreset;

  // ── Calculaciones ────────────────────────────────────────────────────────
  const calculatedItems = useMemo(
    () => items.map((i) => calcularItem(toItemInput(i))),
    [items]
  );
  const totalesCosto = useMemo(
    () => calcularTotalesDocumento(calculatedItems),
    [calculatedItems]
  );

  const margenConfig = useMemo(
    () => ({ porcentaje: margenPorcentaje, tipo: margenTipo, redondeo: margenRedondeo }),
    [margenPorcentaje, margenTipo, margenRedondeo]
  );

  const itemsConMargen = useMemo(
    () => (margenPorcentaje > 0 ? items.map((i) => aplicarMargenAItem(toItemInput(i), margenConfig)) : items.map(toItemInput)),
    [items, margenConfig, margenPorcentaje]
  );
  const calculatedItemsConMargen = useMemo(
    () => itemsConMargen.map(calcularItem),
    [itemsConMargen]
  );
  const totales = useMemo(
    () => calcularTotalesDocumento(calculatedItemsConMargen),
    [calculatedItemsConMargen]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const agregarItem = () => {
    const item = makeItem();
    setItems((prev) => [...prev, item]);
    setExpandedItems((prev) => new Set([...prev, item.id]));
  };

  const eliminarItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setExpandedItems((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
  };

  const updateItem = <K extends keyof ItemForm>(id: string, field: K, value: ItemForm[K]) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleTipoChange = (id: string, tipoItem: TipoItem, fuenteCompra?: FuenteCompra) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const fuente = fuenteCompra ?? item.fuenteCompra ?? "LOCAL";
        const defaults = getItemDefaults(tipoItem, fuente);
        return { ...item, tipoItem, fuenteCompra: fuente, ...defaults };
      })
    );
  };

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setFormError(null);
    if (!clienteInfo.nombres.trim()) {
      setFormError("El nombre del cliente es obligatorio.");
      toast.error("El nombre del cliente es obligatorio.");
      return;
    }
    const invalidItems = calculatedItems.filter((i) => !i.descripcion.trim() || i.precioUnitarioBase <= 0);
    if (invalidItems.length > 0) {
      setFormError("Todos los ítems deben tener descripción y precio mayor a $0.");
      toast.error("Todos los ítems deben tener descripción y precio mayor a $0.");
      return;
    }
    setIsSaving(true);
    try {
      const clienteDb = selectedCustomerId
        ? { id: selectedCustomerId }
        : await createCustomer({ nombres: clienteInfo.nombres, email: clienteInfo.email, notas: clienteInfo.notas });

      if (isEditMode && editDocument) {
        const result = await updateDocument(editDocument.documentId, {
          clienteId: clienteDb.id,
          items: calculatedItemsConMargen,
          totales,
          observaciones: clienteInfo.notas,
          margenPorcentaje,
          margenTipo,
          margenRedondeo,
        });
        if (result.success) {
          toast.success(`${isLabel} actualizada exitosamente`);
          router.push(`/documentos/${editDocument.documentId}`);
        } else {
          setFormError(result.error ?? "Error al actualizar el documento.");
          toast.error(result.error ?? "Error al actualizar el documento.");
        }
      } else {
        const doc = await saveDocument({
          tipo: tipoDocumento,
          clienteId: clienteDb.id,
          items: calculatedItemsConMargen,
          totales,
          observaciones: clienteInfo.notas,
          cotizacionOrigenId: cotizacionOrigenId ?? undefined,
          margenPorcentaje,
          margenTipo,
          margenRedondeo,
        });
        if (doc.success && doc.document) {
          const savedData = doc.document;
          toast.success(`${isLabel} guardada exitosamente`);
          setSavedDoc({
            numero: savedData.numero,
            id: savedData.id,
            totalFinal: totales.totalFinal,
            cotizacionOrigenId: cotizacionOrigenId ?? undefined,
            cotizacionOrigenNumero: cotizacionOrigenNumero ?? undefined,
          });
        } else {
          setFormError(doc.error ?? "Error al guardar el documento.");
          toast.error(doc.error ?? "Error al guardar el documento.");
        }
      }
    } catch {
      setFormError("Ocurrió un error al guardar. Verifica los datos e intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImport = (data: ImportedCotizacionData) => {
    setClienteInfo({ nombres: data.clienteNombre, email: data.clienteEmail, notas: data.observaciones });
    setSelectedCustomerId(data.clienteId);
    setItems(
      data.items.length > 0
        ? data.items.map((i) => ({
            ...i,
            tipoItem: (i as ItemForm).tipoItem ?? "PRODUCTO",
            fuenteCompra: (i as ItemForm).fuenteCompra ?? "LOCAL",
          }))
        : [{ ...makeItem(), id: "1" }]
    );
    setCotizacionOrigenId(data.cotizacionOrigenId);
    setCotizacionOrigenNumero(data.cotizacionNumero);
    setExpandedItems(new Set());
    setFormError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setItems([{ ...makeItem(), id: "1" }]);
    setClienteInfo({ nombres: "", email: "", notas: "" });
    setExpandedItems(new Set());
    setSavedDoc(null);
    setFormError(null);
    setFormatoPDF("completo");
    setSelectedCustomerId(null);
    setCotizacionOrigenId(null);
    setCotizacionOrigenNumero(null);
    setMargenPreset(0);
    setMargenManual(20);
    setMargenTipo("base");
    setMargenRedondeo(0);
  };

  const hasFormData =
    clienteInfo.nombres.trim() !== "" ||
    items.some((i) => i.descripcion.trim() !== "" || i.precioUnitarioBase > 0);

  const pdfNumero = savedDoc?.numero ?? (isEditMode ? editDocument?.documentNumero : undefined);

  // ── PDF Viewer Content (shared between preview and saved) ──────────────
  const pdfViewerContent = () => (
    <ClientPDFViewer
      formato={formatoPDF}
      numero={pdfNumero}
      cliente={clienteInfo}
      items={calculatedItemsConMargen}
      totales={totales}
      tipoDocumento={tipoDocumento}
      seller={seller}
    />
  );

  const pdfTemplateTabs = (
    <div className="flex items-center gap-1 px-6 py-3 border-b border-[var(--border-0)] bg-[var(--surface-2)]/50">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-2)] mr-2">Plantilla:</span>
      {(["completo", "resumido", "concatenado"] as const).map((f) => (
        <button
          key={f}
          onClick={() => setFormatoPDF(f)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
            formatoPDF === f
              ? "bg-amber-400 text-[oklch(0.090_0.025_255)] shadow-sm"
              : "text-[var(--text-1)] hover:text-[var(--text-0)] hover:bg-[var(--surface-2)]"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col xl:flex-row gap-6 w-full">
      {/* ── Main forms ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Banner: datos pre-cargados desde cotización */}
        {cotizacionOrigenId && cotizacionOrigenNumero && !savedDoc && (
          <div className="flex items-start gap-3 p-4 bg-teal-400/8 border border-teal-400/20 rounded-2xl">
            <div className="w-8 h-8 rounded-xl bg-teal-400/15 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-teal-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-0)]">
                Pre-cargado desde cotización{" "}
                <span className="text-teal-500">{cotizacionOrigenNumero}</span>
              </p>
              <p className="text-xs text-[var(--text-2)] mt-0.5">
                Todos los ítems y datos del cliente han sido importados. Puedes modificarlos antes de guardar.
              </p>
            </div>
            <button
              onClick={() => {
                setCotizacionOrigenId(null);
                setCotizacionOrigenNumero(null);
              }}
              className="text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors shrink-0"
              title="Descartar origen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Items Section */}
        <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-0)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center">
                <FileText className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-[var(--text-0)] font-semibold text-sm">Detalle de Ítems</h3>
                <p className="text-[var(--text-2)] text-xs">
                  {items.length} {items.length === 1 ? "ítem" : "ítems"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {tipoDocumento === "FACTURA" && (
                <ImportarCotizacionModal onImport={handleImport} hasFormData={hasFormData} />
              )}
              <button
                onClick={agregarItem}
                className="flex items-center gap-2 px-3.5 py-2 bg-amber-400/10 hover:bg-amber-400/20 text-amber-500 text-sm font-semibold rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Añadir ítem</span>
              </button>
            </div>
          </div>

          {/* Item rows */}
          {calculatedItems.map((calculatedItem, idx) => {
            const formItem = items[idx];
            return (
              <ItemRow
                key={formItem.id}
                item={formItem}
                idx={idx}
                expanded={expandedItems.has(formItem.id)}
                onUpdate={updateItem}
                onRemove={eliminarItem}
                onToggleExpand={toggleExpanded}
                onTipoChange={handleTipoChange}
              />
            );
          })}

          {/* Footer add row */}
          <div className="px-5 py-3 border-t border-[var(--border-0)] flex items-center justify-between">
            <button
              onClick={agregarItem}
              className="flex items-center gap-2 text-sm text-[var(--text-1)] hover:text-amber-500 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Agregar otro ítem
            </button>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-2)]">
              {items.length} {items.length === 1 ? "ítem" : "ítems"}
            </span>
          </div>
        </div>

        {/* Customer Section */}
        <CustomerSelector
          clienteInfo={clienteInfo}
          selectedCustomerId={selectedCustomerId}
          formError={formError}
          onClienteChange={setClienteInfo}
          onCustomerIdChange={setSelectedCustomerId}
        />
      </div>

      {/* ── Summary Panel ──────────────────────────────────────────────── */}
      <div className="xl:w-80 shrink-0">
        <div className="xl:sticky xl:top-24 space-y-4">
          {/* Totales */}
          <DocumentTotals
            totales={totales}
            isLabel={isLabel}
            margen={margenPorcentaje > 0 ? margenConfig : undefined}
            items={items}
          />

          {/* Action buttons / Success state */}
          <div className="bg-[var(--surface-1)] border border-[var(--border-0)] rounded-2xl px-5 pb-5">
            {savedDoc ? (
              /* ── Success state ─────────────────────────────────── */
              <div className="space-y-3 fade-up">
                <div className="flex flex-col items-center text-center py-5 px-3 bg-green-500/5 border border-green-500/15 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6 text-green-500" strokeWidth={2} />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400 mb-1.5">
                    {isLabel} guardada
                  </div>
                  <div className="text-2xl font-black text-[var(--text-0)] tracking-tight mb-0.5">
                    {savedDoc.numero}
                  </div>
                  <div className="text-sm text-[var(--text-2)]">
                    Total: <span className="font-bold text-[var(--text-0)]">${fmtMoneyDec(savedDoc.totalFinal)}</span>
                  </div>
                  <div className="text-xs text-[var(--text-2)] mt-1">{clienteInfo.nombres}</div>
                </div>

                <PDFDownloadButton
                  formato={formatoPDF}
                  numero={savedDoc.numero}
                  cliente={clienteInfo}
                  items={calculatedItemsConMargen}
                  totales={totales}
                  tipoDocumento={tipoDocumento}
                  seller={seller}
                  fileName={`${savedDoc.numero}.pdf`}
                  label="Descargar PDF"
                  className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] font-bold py-3 rounded-xl transition-all text-sm shadow-md shadow-amber-400/20"
                />

                <Dialog>
                  <DialogTrigger className="w-full flex items-center justify-center gap-2 bg-[var(--surface-2)] hover:bg-[var(--border-0)] border border-[var(--border-0)] text-[var(--text-1)] hover:text-[var(--text-0)] font-semibold py-3 rounded-xl transition-all text-sm">
                    <Eye className="w-4 h-4" />
                    Vista previa PDF
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto bg-[var(--surface-1)] border-[var(--border-0)] p-0">
                    <div className="px-6 pt-6 pb-4 border-b border-[var(--border-0)]">
                      <DialogTitle className="text-[var(--text-0)] font-bold text-base">{savedDoc.numero}</DialogTitle>
                      <p className="text-[var(--text-2)] text-xs mt-0.5">Vista previa del documento</p>
                    </div>
                    {pdfTemplateTabs}
                    <div className="p-5">{pdfViewerContent()}</div>
                  </DialogContent>
                </Dialog>

                <button
                  onClick={handleReset}
                  className="w-full flex items-center justify-center gap-2 bg-[var(--surface-2)] hover:bg-[var(--border-0)] border border-[var(--border-0)] text-[var(--text-1)] hover:text-[var(--text-0)] font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  {tipoDocumento === "COTIZACION" ? "Nueva Cotización" : "Nueva Factura"}
                </button>

                <Link
                  href={`/documentos/${savedDoc.id}`}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--text-1)] hover:text-[var(--text-0)] font-semibold py-2 transition-colors border border-[var(--border-0)] rounded-xl"
                >
                  Ver {tipoDocumento === "COTIZACION" ? "cotización" : "factura"} guardada →
                </Link>

                {savedDoc.cotizacionOrigenId && savedDoc.cotizacionOrigenNumero && (
                  <Link
                    href={`/documentos/${savedDoc.cotizacionOrigenId}`}
                    className="flex items-center justify-center gap-1.5 text-xs text-teal-500 hover:text-teal-400 font-medium py-1 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    Ver cotización origen {savedDoc.cotizacionOrigenNumero}
                  </Link>
                )}

                <Link
                  href="/"
                  className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-2)] hover:text-[var(--text-1)] font-medium py-1.5 transition-colors"
                >
                  ← Volver al inicio
                </Link>
              </div>
            ) : (
              /* ── Default actions ───────────────────────────────── */
              <div className="space-y-2.5 pt-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 disabled:cursor-not-allowed text-[oklch(0.090_0.025_255)] font-bold py-3.5 rounded-xl transition-all text-sm shadow-md shadow-amber-400/20"
                >
                  {isSaving ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {isEditMode ? "Guardar cambios" : `Guardar ${isLabel}`}
                    </>
                  )}
                </button>

                <Dialog>
                  <DialogTrigger className="w-full flex items-center justify-center gap-2 bg-[var(--surface-2)] hover:bg-[var(--border-0)] border border-[var(--border-0)] text-[var(--text-1)] hover:text-[var(--text-0)] font-semibold py-3.5 rounded-xl transition-all text-sm">
                    <Eye className="w-4 h-4" />
                    Vista Previa PDF
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto bg-[var(--surface-1)] border-[var(--border-0)] p-0">
                    <div className="px-6 pt-6 pb-4 border-b border-[var(--border-0)]">
                      <DialogTitle className="text-[var(--text-0)] font-bold text-base">Vista Previa</DialogTitle>
                      <p className="text-[var(--text-2)] text-xs mt-0.5">
                        {tipoDocumento === "COTIZACION" ? "Cotización" : "Factura"} — sin guardar aún
                      </p>
                    </div>
                    {pdfTemplateTabs}
                    <div className="p-5">{pdfViewerContent()}</div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>

          {/* Info note */}
          <div className="mx-0 flex items-start gap-2.5 bg-amber-400/5 border border-amber-400/10 rounded-xl p-3">
            <svg className="w-3.5 h-3.5 text-amber-500/60 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-[var(--text-2)] leading-relaxed">
              Válida por <span className="text-amber-500/80 font-semibold">15 días</span> calendario
              desde su generación según políticas comerciales.
            </p>
          </div>

          {/* Margen */}
          {!savedDoc && (
            <MargenPanel
              margenPreset={margenPreset}
              margenManual={margenManual}
              margenTipo={margenTipo}
              margenRedondeo={margenRedondeo}
              margenPorcentaje={margenPorcentaje}
              totalesCostoFinal={totalesCosto.totalFinal}
              totalesFinal={totales.totalFinal}
              onPresetChange={setMargenPreset}
              onManualChange={setMargenManual}
              onTipoChange={setMargenTipo}
              onRedondeoChange={setMargenRedondeo}
            />
          )}
        </div>
      </div>
    </div>
  );
}
