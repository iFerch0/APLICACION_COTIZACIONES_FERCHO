"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Plus, Trash2, Printer } from "lucide-react";
import { ItemInput, calcularItem, calcularTotalesDocumento } from "@/lib/calculator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { createCustomer } from "@/app/actions/customers";
import { saveDocument } from "@/app/actions/documents";

const ClientPDFViewer = dynamic(() => import("@/components/pdf/ClientPDFViewer"), {
  ssr: false,
});

export interface DocumentFormProps {
  tipoDocumento?: "COTIZACION" | "FACTURA";
}

export default function CotizacionForm({ tipoDocumento = "COTIZACION" }: DocumentFormProps) {
  const [clienteInfo, setClienteInfo] = useState({ nombres: "", email: "", notas: "" });
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formatoPDF, setFormatoPDF] = useState<"completo" | "resumido" | "concatenado">("completo");
  const [items, setItems] = useState<ItemInput[]>([
    {
      id: "1",
      descripcion: "",
      cantidad: 1,
      precioUnitarioBase: 0,
      aplicaTax: false,
      taxUnitario: 0,
      envioUnitario: 0,
      promocionEnvioUnitario: 0,
      importacionUnitario: 0,
      aplicaAmazon: false,
    },
  ]);

  const [aplica4x1000Global, setAplica4x1000Global] = useState(false);

  const agregarItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        descripcion: "",
        cantidad: 1,
        precioUnitarioBase: 0,
        aplicaTax: false,
        taxUnitario: 0,
        envioUnitario: 0,
        promocionEnvioUnitario: 0,
        importacionUnitario: 0,
        aplicaAmazon: false,
      },
    ]);
  };

  const eliminarItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateItem = <K extends keyof ItemInput>(
    id: string,
    field: K,
    value: ItemInput[K]
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const calculatedItems = useMemo(() => items.map(calcularItem), [items]);
  const totales = useMemo(
    () => calcularTotalesDocumento(calculatedItems, aplica4x1000Global),
    [calculatedItems, aplica4x1000Global]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full">
      {/* Left Column: Main Forms */}
      <div className="lg:col-span-2 space-y-8">
        
        {/* Customer Information */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <svg className="w-6 h-6 text-[#24aceb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <h3 className="text-lg font-bold">Información del Cliente</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre del Cliente</span>
              <input 
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:border-[#24aceb] focus:ring-1 focus:ring-[#24aceb] outline-none h-12 px-4 text-base transition-colors" 
                placeholder="Ej: Juan Pérez" 
                type="text"
                value={clienteInfo.nombres}
                onChange={(e) => setClienteInfo({...clienteInfo, nombres: e.target.value})}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email de Contacto</span>
              <input 
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:border-[#24aceb] focus:ring-1 focus:ring-[#24aceb] outline-none h-12 px-4 text-base transition-colors" 
                placeholder="cliente@empresa.com" 
                type="email"
                value={clienteInfo.email}
                onChange={(e) => setClienteInfo({...clienteInfo, email: e.target.value})}
              />
            </label>
            <label className="flex flex-col gap-2 md:col-span-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Notas Internas o Comentarios</span>
              <textarea 
                className="w-full rounded-lg border border-slate-200 dark:border-slate-800 dark:bg-slate-950 focus:border-[#24aceb] focus:ring-1 focus:ring-[#24aceb] outline-none p-4 text-base resize-none transition-colors" 
                placeholder="Detalles adicionales sobre los términos o condiciones..." 
                rows={3}
                value={clienteInfo.notas}
                onChange={(e) => setClienteInfo({...clienteInfo, notas: e.target.value})}
              ></textarea>
            </label>
          </div>
        </section>

        {/* Items Table */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-[#24aceb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
              </svg>
              <h3 className="text-lg font-bold">Detalle de Ítems</h3>
            </div>
            <button 
              onClick={agregarItem}
              className="flex items-center gap-2 text-[#24aceb] font-bold text-sm hover:bg-[#24aceb]/5 px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Añadir Ítem
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-4 px-2 w-[35%]">Descripción</th>
                  <th className="pb-4 px-2 w-16">Cant.</th>
                  <th className="pb-4 px-2 w-28">Precio Base</th>
                  <th className="pb-4 px-2 w-28">Cargos Adic.</th>
                  <th className="pb-4 px-2 w-28 text-center">Garantía</th>
                  <th className="pb-4 px-2 w-32 text-right">Subtotal</th>
                  <th className="pb-4 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {calculatedItems.map((item) => (
                  <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="py-4 px-2 align-top">
                      <input 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md py-2 px-3 text-sm focus:border-[#24aceb] focus:ring-1 focus:ring-[#24aceb] outline-none transition-colors h-[88px]" 
                        type="text" 
                        placeholder="Nombre del producto..."
                        value={item.descripcion}
                        onChange={(e) => updateItem(item.id, "descripcion", e.target.value)}
                      />
                    </td>
                    <td className="py-4 px-2 align-top">
                      <input 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-sm py-2 px-2 text-center focus:border-[#24aceb] focus:ring-1 focus:ring-[#24aceb] outline-none transition-colors" 
                        type="number" 
                        min="1"
                        value={item.cantidad || ""}
                        onChange={(e) => updateItem(item.id, "cantidad", Number(e.target.value))}
                      />
                    </td>
                    <td className="py-4 px-2 align-top">
                      <input 
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md text-sm py-2 px-2 focus:border-[#24aceb] focus:ring-1 focus:ring-[#24aceb] outline-none transition-colors" 
                        type="number" 
                        placeholder="$0.00"
                        value={item.precioUnitarioBase || ""}
                        onChange={(e) => updateItem(item.id, "precioUnitarioBase", Number(e.target.value))}
                      />
                      <div className="mt-2 text-[10px] text-slate-400 font-medium">Unidad COP</div>
                    </td>
                    <td className="py-4 px-2 align-top">
                      <div className="flex flex-col gap-1.5 w-full">
                        <label className="flex items-center gap-2 group/tax relative">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-[#24aceb] focus:ring-[#24aceb]"
                            checked={item.aplicaTax}
                            onChange={(e) => updateItem(item.id, "aplicaTax", e.target.checked)}
                          /> 
                          <span className="text-xs text-slate-500 font-medium">Extra</span>
                          {item.aplicaTax && (
                            <input 
                              type="number"
                              className="absolute left-16 w-[70px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs py-0.5 px-1 focus:border-[#24aceb] focus:ring-1 focus:ring-[#24aceb] outline-none transition-colors"
                              placeholder="$0.00"
                              value={item.taxUnitario || ""}
                              onChange={(e) => updateItem(item.id, "taxUnitario", Number(e.target.value))}
                            />
                          )}
                        </label>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Env</span>
                          <input 
                            type="number" 
                            className="w-[70px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs py-0.5 px-1 focus:border-[#24aceb] focus:ring-1 focus:ring-[#24aceb] outline-none transition-colors"
                            placeholder="$0"
                            value={item.envioUnitario || ""}
                            onChange={(e) => updateItem(item.id, "envioUnitario", Number(e.target.value))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Pro</span>
                          <input 
                            type="number" 
                            className="w-[70px] bg-blue-50/30 border border-blue-200 rounded text-xs py-0.5 px-1 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-colors"
                            placeholder="-$0"
                            value={item.promocionEnvioUnitario || ""}
                            onChange={(e) => updateItem(item.id, "promocionEnvioUnitario", Number(e.target.value))}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Imp</span>
                          <input 
                            type="number" 
                            className="w-[70px] bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded text-xs py-0.5 px-1 focus:border-[#24aceb] focus:ring-1 focus:ring-[#24aceb] outline-none transition-colors"
                            placeholder="$0"
                            value={item.importacionUnitario || ""}
                            onChange={(e) => updateItem(item.id, "importacionUnitario", Number(e.target.value))}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 align-top text-center">
                      <div className="flex flex-col items-center gap-2 mt-2">
                        <label className="flex items-center justify-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="rounded border-slate-300 text-[#24aceb] focus:ring-[#24aceb] h-4 w-4"
                            checked={item.aplicaAmazon}
                            onChange={(e) => updateItem(item.id, "aplicaAmazon", e.target.checked)}
                          /> 
                          <span className="text-xs font-bold text-slate-600">Amz</span>
                        </label>
                        {item.aplicaAmazon ? (
                            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1 py-0.5 rounded">
                              + ${item.amazonUnitarioCalculado.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold">Inactivo</span>
                          )}
                      </div>
                    </td>
                    <td className="py-4 px-2 align-top text-right">
                      <div className="flex flex-col h-full items-end justify-center pt-2">
                        <div className="font-bold text-sm text-slate-900 border-b border-dashed border-slate-300 pb-1 mb-1">
                          ${item.subtotalLinea.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          Nto.Unit: ${item.costoUnitarioFinal.toLocaleString("es-CO", { minimumFractionDigits: 0 })}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 align-top text-right pt-5">
                      <button 
                        onClick={() => eliminarItem(item.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors bg-white rounded-md hover:bg-red-50 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Global Settings */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Configuración Global</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ajustes impositivos y financieros para el documento completo.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={aplica4x1000Global}
                onChange={(e) => setAplica4x1000Global(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#24aceb]"></div>
              <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">Aplicar 4x1000 Global</span>
            </label>
          </div>
        </section>

      </div>

      {/* Right Column: Summary & Actions */}
      <div className="space-y-6">
        <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-8 shadow-xl sticky top-28">
          <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
            <svg className="w-6 h-6 text-[#24aceb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            Resumen de Cotización
          </h3>
          
          <div className="space-y-4 border-b border-white/10 pb-6 mb-6">
            <div className="flex justify-between text-slate-400">
              <span className="text-sm">Subtotal Items</span>
              <span className="font-medium">${totales.subtotal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
            </div>
            
            {(totales.totalTax > 0) && (
              <div className="flex justify-between text-slate-400">
                <span className="text-sm">Total Impuestos (Tax)</span>
                <span className="font-medium">${totales.totalTax.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            
            <div className="flex justify-between text-slate-400">
              <span className="text-sm">Total Envío (Neto)</span>
              <span className="font-medium">${(totales.totalEnvio - totales.totalPromocionEnvio).toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="flex justify-between text-slate-400">
              <span className="text-sm">Total Importación</span>
              <span className="font-medium">${totales.totalImportacion.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="flex justify-between text-slate-400">
              <span className="text-sm">Total Garantía Amz</span>
              <span className="font-medium">${totales.totalAmazon.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
            </div>

            {aplica4x1000Global && (
              <div className="flex justify-between text-rose-300">
                <span className="text-sm">Retención 4x1000</span>
                <span className="font-medium">+ ${totales.total4x1000.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-end mb-8">
            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-widest text-[#24aceb] font-bold">Total Final</span>
              <span className="text-4xl font-black">${totales.totalFinal.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={async () => {
                if (!clienteInfo.nombres) return alert("Ingresa el nombre del cliente.");
                setIsSaving(true);
                try {
                  const clienteDb = await createCustomer({ 
                    nombres: clienteInfo.nombres, 
                    email: clienteInfo.email, 
                    notas: clienteInfo.notas 
                  });
                  setClienteId(clienteDb.id);
                  const doc = await saveDocument({
                    tipo: tipoDocumento,
                    clienteId: clienteDb.id,
                    items: calculatedItems,
                    totales: totales,
                    observaciones: clienteInfo.notas
                  });
                  if(doc.success) {
                     alert(`${tipoDocumento === "COTIZACION" ? "Cotización" : "Factura"} guardada exitosamente: ` + doc.document.numero);
                  }
                } catch (e) {
                  alert("Error al guardar.");
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="w-full bg-[#24aceb] hover:bg-[#24aceb]/90 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
              </svg>
              {isSaving ? "Procesando Sistema" : "Guardar Cotización"}
            </button>
            
            <Dialog>
              <DialogTrigger className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                Previsualización PDF
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-md">
                <DialogHeader>
                  <DialogTitle className="text-xl">Previsualización del Documento ({tipoDocumento})</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-5 pt-4">
                  <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-50 p-4 rounded-xl">
                    <span className="font-semibold text-gray-700 min-w-max">Plantilla de Visualización:</span>
                    <select 
                      className="border border-gray-200 p-2.5 rounded-lg bg-white text-sm w-full outline-none focus:ring-1 focus:ring-[#24aceb]"
                      value={formatoPDF}
                      onChange={(e) => setFormatoPDF(e.target.value as "completo" | "resumido" | "concatenado")}
                    >
                      <option value="completo">Completo (Transparente con aduanas, envíos y Amazon)</option>
                      <option value="resumido">Resumido (Modelo Simplificado Integrado)</option>
                      <option value="concatenado">Concatenado (Solo Texto formal)</option>
                    </select>
                  </div>
                  <div className="rounded-xl overflow-hidden shadow-2xl bg-gray-100 border border-gray-200">
                    <ClientPDFViewer 
                      formato={formatoPDF} 
                      cliente={clienteInfo} 
                      items={calculatedItems} 
                      totales={totales} 
                      aplica4x1000Global={aplica4x1000Global} 
                      tipoDocumento={tipoDocumento}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
          </div>
          
          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="bg-[#24aceb]/10 rounded-lg p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-[#24aceb] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="text-xs text-slate-400 leading-relaxed">
                Esta cotización tendrá una validez de 15 días calendario a partir de su generación según políticas comerciales.
              </p>
            </div>
          </div>
        </div>
        
        {/* Additional Context/Quick Info from HTML */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#24aceb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Últimas Cotizaciones
          </h4>
          <ul className="space-y-3 text-xs">
            <li className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
              <span className="text-slate-600 dark:text-slate-400">COT-EJEMPLO-001</span>
              <span className="font-bold">$2.500,00</span>
            </li>
            <li className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
              <span className="text-slate-600 dark:text-slate-400">COT-EJEMPLO-002</span>
              <span className="font-bold">$1.840,00</span>
            </li>
          </ul>
        </div>
        
      </div>
    </div>
  );
}
