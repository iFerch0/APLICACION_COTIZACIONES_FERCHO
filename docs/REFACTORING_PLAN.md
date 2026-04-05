# Plan Completo de Refactorización y Mejoras — CotizaPro

> **Fecha:** Abril 2026  
> **Proyecto:** CotizaPro — Sistema de Cotizaciones y Facturas Comerciales  
> **Stack:** Next.js 16 App Router · TypeScript · Tailwind v4 · shadcn/ui · Prisma · @react-pdf/renderer  
> **Deploy target:** Vercel + Supabase (PostgreSQL)

---

## Tabla de Contenidos

1. [Negocio Real — Modelo de Cotización](#negocio-real--modelo-de-cotización)
2. [A) Librerías](#a-librerías)
3. [B) Arquitectura y Patrones](#b-arquitectura-y-patrones)
4. [C) Estructura de Archivos Propuesta](#c-estructura-de-archivos-propuesta)
5. [D) Mejoras por Módulo](#d-mejoras-por-módulo)
6. [E) Buenas Prácticas](#e-buenas-prácticas)
7. [F) Cronograma](#f-cronograma)

---

## Negocio Real — Modelo de Cotización

> **Esta sección documenta las reglas de negocio reales del sistema.**
> Cualquier cambio en calculator, formulario, schema o PDF DEBE respetar estas reglas.

### Descripción del Negocio

El usuario realiza tres actividades principales:

1. **Cotizar armado de computadores** — Agrupa múltiples piezas (CPU, RAM, GPU, etc.) en una cotización única. Las piezas pueden provenir de fuentes mixtas (locales + importadas).
2. **Venta de piezas individuales** — Cotización de un solo producto, local o importado.
3. **Servicios de mantenimiento de PCs** — Servicio sin costos de importación, envío ni tax.

### Fuentes de Compra

| Fuente | Identificador | Costos que aplican |
|--------|--------------|-------------------|
| **Local (Colombia)** | `LOCAL` | precio + envío local (dentro de Colombia) |
| **Amazon** | `AMAZON` | precio + tax US 7% + envío internacional + promo envío + importación + garantía 2.25% |
| **Exterior otro** (eBay, Newegg, etc.) | `EXTERIOR_OTRO` | precio + tax US 7% + envío internacional + importación (sin garantía Amazon) |

**Importante:** Los productos locales **también pueden tener envío** (dentro de Colombia). El envío no es exclusivo de importaciones.

### Tipos de Ítem

| Tipo | Identificador | Comportamiento |
|------|--------------|----------------|
| **Producto** | `PRODUCTO` | Todos los costos aplican según fuente de compra |
| **Servicio** | `SERVICIO` | Solo descripción + precio. Sin tax, envío, importación ni Amazon fee |

### Desglose de Costos por Escenario

#### Escenario 1: Pieza local con envío

```
precioUnitarioBase (COP)
+ envioUnitario (envío local en Colombia)
= costoUnitarioFinal
```

- Sin tax US, sin Amazon fee, sin importación.

#### Escenario 2: Pieza importada de Amazon

```
precioUnitarioBase (precio en USD convertido a COP, o COP directo)
+ taxUnitario (7% sales tax de EE.UU.)
+ envioUnitario (envío desde EE.UU. hasta Colombia)
- promocionEnvioUnitario (si hay promo de envío free)
+ importacionUnitario (IVA 19% + arancel colombiano)
+ amazonUnitarioCalculado (2.25% de garantía por tasa de cambio)
= costoUnitarioFinal
```

**Amazon fee (2.25%) se calcula sobre:**
```
baseGarantia = precioUnitarioBase + taxUnitario + envioUnitario
amazonFee = baseGarantia × 0.0225
```

**NO incluye `importacionUnitario`** en la base. Amazon no cobra garantía sobre aranceles colombianos.

#### Escenario 3: Pieza importada de eBay/Newegg

```
precioUnitarioBase
+ taxUnitario (7% sales tax)
+ envioUnitario
+ importacionUnitario
= costoUnitarioFinal
```

Sin Amazon fee.

#### Escenario 4: Servicio de mantenimiento

```
precioUnitarioBase (precio del servicio)
= costoUnitarioFinal
```

Solo descripción + precio. Todos los campos de costos están ocultos.

#### Escenario 5: PC ensamblada con partes de fuentes mixtas

Múltiples ítems agrupados por `grupoId`. Cada ítem conserva su propia fuente de compra y cálculo de costos independiente. El `grupoId` permite la agrupación visual en el formulario y en el PDF.

### Comportamiento del Formulario Inteligente (Ítem Inteligente)

| tipoItem + fuenteCompra | Campos visibles | Automático |
|---|---|---|
| `PRODUCTO` + `LOCAL` | precio, envío local | Sin tax US, sin Amazon, sin importación |
| `PRODUCTO` + `AMAZON` | precio, tax US, envío, promo envío, importación | Amazon fee auto (2.25%), tax auto (7%) |
| `PRODUCTO` + `EXTERIOR_OTRO` | precio, tax US, envío, importación | Sin Amazon fee |
| `SERVICIO` + (cualquiera) | solo descripción + precio | Todos los costos ocultos |

### Bug Crítico: Amazon Fee Calculation (HOT FIX)

**Archivo:** `src/lib/calculator.ts` línea 74

**Problema actual:**
```typescript
// INCORRECTO — incluye importacionUnitario en la base de garantía
const baseGarantia = item.precioUnitarioBase + tax + envioBase + importacion;
```

Amazon NO cobra garantía sobre aranceles colombianos. Solo cobra sobre lo que Amazon factura: producto + tax + envío.

**Corrección:**
```typescript
// CORRECTO — sin importacionUnitario
const baseGarantia = item.precioUnitarioBase + tax + envioBase;
```

**Impacto:** Todas las cotizaciones con ítems de Amazon tienen el fee calculado por encima del valor real.

---

## A) Librerías

### A.1 Librerías a ELIMINAR

| Librería | Razón de eliminación |
|----------|---------------------|
| `@base-ui/react` | **No se usa en ningún archivo del proyecto.** Se verificó con grep y no hay imports. Es dead weight que aumenta `node_modules`. |
| `@radix-ui/react-icons` | **Redundante con Lucide React.** Solo se usa Lucide en toda la app (`lucide-react`). Tener dos librerías de iconos es innecesario. |

**Comando:**
```bash
npm uninstall @base-ui/react @radix-ui/react-icons
```

### A.2 Librerías a AGREGAR

| Librería | Versión | Propósito en el proyecto |
|----------|---------|--------------------------|
| `sonner` | ^2.x | **Sistema de notificaciones toast.** Reemplaza los `setFormError` manuales con notificaciones elegantes y consistentes. shadcn/ui incluye un wrapper `sonner` que se integra con el theme actual. Permite `toast.success()`, `toast.error()`, `toast.promise()`. |
| `@hookform/resolvers` | (ya instalada) | Se usará con Zod para validar formularios vía `zodResolver()`. |
| `zod` | (ya instalada v4) | Crear schemas de validación para server actions y formularios. Ya está en `package.json` pero **no se usa en ningún archivo**. |
| `nuqs` | ^2.x | **Parser de searchParams tipado.** Reemplaza el parseo manual de `searchParams` en páginas como `facturas/nueva/page.tsx` (`fromCotizacion`). Ofrece `parseAsString`, `parseAsBoolean`, SSR-safe, con URL sync. |

**Comando:**
```bash
npm install sonner nuqs
npx shadcn@latest add sonner
```

### A.3 Librerías que se mantienen (ya están y se usan)

| Librería | Uso actual | Notas |
|----------|-----------|-------|
| `next` ^16.2.2 | Framework principal | App Router, Server Components, Server Actions |
| `react` / `react-dom` 19.2.3 | UI runtime | React 19 con ref como prop nativa |
| `@prisma/client` ^5.22.0 | ORM base de datos | **Migrar de SQLite a PostgreSQL** para Supabase |
| `prisma` ^5.22.0 | CLI migraciones | Dev dependency |
| `@react-pdf/renderer` ^4.3.2 | Generación PDF | CotizacionPDF, 3 formatos |
| `next-themes` ^0.4.6 | Dark/light mode | ThemeProvider ya implementado |
| `lucide-react` ^0.577.0 | Iconos | Única librería de iconos necesaria |
| `tailwindcss` ^4 | Estilos | CSS-first config con `@theme` |
| `tw-animate-css` ^1.4.0 | Animaciones | Integración con shadcn |
| `class-variance-authority` ^0.7.1 | Variantes de componentes | Usado por shadcn/ui |
| `clsx` + `tailwind-merge` | `cn()` utility | Ya en `lib/utils.ts` |
| `react-hook-form` ^7.71.2 | Manejo de formularios | **Se usará activamente** con validación Zod |
| `date-fns` ^4.1.0 | Formato de fechas | `format()`, `es` locale |
| `shadcn` ^4.0.5 | Componentes UI | CLI + componentes base |

---

## B) Arquitectura y Patrones

### B.0 HOT FIX: Corrección de Amazon Fee en calculator.ts

**Prioridad:** 🔴 CRÍTICA — Debe aplicarse ANTES que cualquier otra refactorización.

**Archivo:** `src/lib/calculator.ts`

**Cambio 1 — Corregir la base de garantía (línea 74):**

```typescript
// ANTES (INCORRECTO):
const baseGarantia = item.precioUnitarioBase + tax + envioBase + importacion;

// DESPUÉS (CORRECTO):
const baseGarantia = item.precioUnitarioBase + tax + envioBase;
```

**Cambio 2 — Actualizar el comentario (líneas 72-73):**

```typescript
// ANTES:
// Amazon Garantia se cobra sobre el Precio Base sumado a Cargos de importación, e impuestos.
// IMPORTANTE: Amazon calcula la garantía incluyendo el envío BRUTO (envioBase), ANTES de aplicar cualquier promoción (Free Shipping).

// DESPUÉS:
// Amazon Garantía (2.25%) se cobra sobre lo que Amazon factura: precio base + tax + envío bruto.
// NO incluye importacionUnitario — Amazon no cobra sobre aranceles colombianos.
// Se usa envío BRUTO (envioBase), ANTES de aplicar cualquier promoción (Free Shipping).
```

**Verificación:** Crear test manual con:
- Precio: $100, Tax: $7, Envío: $20, Importación: $30
- Amazon fee esperado: ($100 + $7 + $20) × 0.0225 = $2.8575
- Antes (incorrecto): ($100 + $7 + $20 + $30) × 0.0225 = $3.5325

### B.0.1 Nuevos Enums y Campos en el Modelo de Datos

**Enums nuevos:**

```typescript
// src/types/index.ts (o inline en calculator.ts)

export type TipoItem = "PRODUCTO" | "SERVICIO";

export type FuenteCompra = "LOCAL" | "AMAZON" | "EXTERIOR_OTRO";
```

**Nuevos campos en `ItemInput` (calculator.ts):**

```typescript
export interface ItemInput {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitarioBase: number;

  // ── Clasificación del ítem (NUEVOS) ──
  tipoItem: TipoItem;              // "PRODUCTO" | "SERVICIO"
  fuenteCompra: FuenteCompra;      // "LOCAL" | "AMAZON" | "EXTERIOR_OTRO"
  precioOriginal?: number;         // Precio en moneda original (ej. USD)
  monedaOriginal?: string;         // "USD", "COP", etc.
  grupoId?: string;                // Agrupar partes de una PC ensamblada

  // ── Costos ──
  aplicaTax: boolean;
  taxUnitario: number;
  envioUnitario: number;
  promocionEnvioUnitario: number;
  importacionUnitario: number;
  aplicaAmazon: boolean;
}
```

**Lógica de auto-configuración por tipoItem + fuenteCompra:**

```typescript
export function getItemDefaults(tipoItem: TipoItem, fuenteCompra: FuenteCompra) {
  if (tipoItem === "SERVICIO") {
    return {
      aplicaTax: false,
      aplicaAmazon: false,
      taxUnitario: 0,
      envioUnitario: 0,
      promocionEnvioUnitario: 0,
      importacionUnitario: 0,
    };
  }

  switch (fuenteCompra) {
    case "LOCAL":
      return {
        aplicaTax: false,
        aplicaAmazon: false,
        taxUnitario: 0,
        envioUnitario: 0,       // editable — productos locales pueden tener envío
        promocionEnvioUnitario: 0,
        importacionUnitario: 0,
      };
    case "AMAZON":
      return {
        aplicaTax: true,
        aplicaAmazon: true,
        taxUnitario: 0,         // se calcula auto como precioUnitarioBase × 0.07
        envioUnitario: 0,
        promocionEnvioUnitario: 0,
        importacionUnitario: 0,
      };
    case "EXTERIOR_OTRO":
      return {
        aplicaTax: true,
        aplicaAmazon: false,
        taxUnitario: 0,         // se calcula auto como precioUnitarioBase × 0.07
        envioUnitario: 0,
        promocionEnvioUnitario: 0,
        importacionUnitario: 0,
      };
  }
}
```

**Nuevo flujo de cálculo en `calcularItem`:**

```typescript
export function calcularItem(item: ItemInput): ItemCalculated {
  // Servicios: sin costos adicionales
  if (item.tipoItem === "SERVICIO") {
    const costoUnitarioFinal = item.precioUnitarioBase;
    return {
      ...item,
      amazonUnitarioCalculado: 0,
      costoUnitarioFinal,
      subtotalLinea: costoUnitarioFinal * item.cantidad,
    };
  }

  // Productos locales: solo precio + envío local
  if (item.fuenteCompra === "LOCAL") {
    const envioBase = item.envioUnitario || 0;
    const costoUnitarioFinal = item.precioUnitarioBase + envioBase;
    return {
      ...item,
      amazonUnitarioCalculado: 0,
      costoUnitarioFinal,
      subtotalLinea: costoUnitarioFinal * item.cantidad,
    };
  }

  // Productos importados (AMAZON o EXTERIOR_OTRO)
  const tax = item.aplicaTax ? item.taxUnitario : 0;
  const envioBase = item.envioUnitario || 0;
  const promoEnvio = item.promocionEnvioUnitario || 0;
  const envioNeto = envioBase - promoEnvio;
  const importacion = item.importacionUnitario || 0;

  // Amazon fee SOLO para fuente AMAZON, sobre precio + tax + envío (sin importación)
  const baseGarantia = item.precioUnitarioBase + tax + envioBase;
  const amazon = item.fuenteCompra === "AMAZON" ? baseGarantia * AMAZON_RATE : 0;

  const costoUnitarioFinal = item.precioUnitarioBase + tax + amazon + envioNeto + importacion;
  const subtotalLinea = costoUnitarioFinal * item.cantidad;

  return {
    ...item,
    amazonUnitarioCalculado: amazon,
    costoUnitarioFinal,
    subtotalLinea,
  };
}
```

### B.1 Refactorización de CotizacionForm.tsx (1,389 → ~8 componentes)

**Problema actual:** Un solo archivo de 1,389 líneas contiene toda la lógica de formulario, cálculos, autocompletado, renderizado desktop/mobile, panel de resumen, panel de margen, PDF preview, y estados de guardado.

**Estrategia de descomposición:**

```
src/components/cotizaciones/
├── CotizacionForm.tsx          → Orchestrator (~200 líneas)
├── items/
│   ├── ItemsTable.tsx          → Tabla desktop de ítems (~180 líneas)
│   ├── ItemsMobileCards.tsx    → Cards mobile de ítems (~200 líneas)
│   ├── ItemRowDesktop.tsx      → Fila individual desktop (~120 líneas)
│   ├── ItemCardMobile.tsx      → Card individual mobile (~120 líneas)
│   ├── ItemChargeInputs.tsx    → Inputs de cargos (Tax, Envío, Promo, Imp) (~80 líneas)
│   ├── ItemTipoSelector.tsx    → Selector tipoItem + fuenteCompra (~60 líneas)
│   └── ItemGroupLabel.tsx      → Etiqueta de grupo (grupoId) para PC ensamblada (~30 líneas)
├── customer/
│   ├── CustomerSection.tsx     → Sección de datos del cliente (~80 líneas)
│   └── CustomerAutocomplete.tsx → Autocomplete con debounce (~60 líneas)
├── summary/
│   ├── SummaryPanel.tsx        → Panel lateral de resumen (~100 líneas)
│   ├── MarginPanel.tsx         → Panel de margen de ganancia (~150 líneas)
│   ├── SavedDocSuccess.tsx     → Estado de éxito post-guardado (~80 líneas)
│   └── SummaryLineItem.tsx     → Línea individual de resumen (~20 líneas)
├── shared/
│   └── SectionHeader.tsx       → Header de sección reutilizable (~20 líneas)
└── hooks/
    ├── useItemsManager.ts      → Estado y CRUD de ítems (~80 líneas)
    ├── useCustomerAutocomplete.ts → Lógica de autocompletado (~50 líneas)
    ├── useDocumentCalculations.ts → useMemo de cálculos (~40 líneas)
    ├── useMarginConfig.ts      → Estado de margen (~30 líneas)
    └── useDocumentSave.ts      → Lógica de guardado (~60 líneas)
```

#### Concepto: Ítem Inteligente (UI Adaptativa)

Cada ítem en el formulario tiene selectores de `tipoItem` y `fuenteCompra` que determinan qué campos son visibles y cuáles se calculan automáticamente. Este es el comportamiento:

**Selector de tipo de ítem:**
- Al cambiar `tipoItem` a `SERVICIO`: se ocultan todos los campos de costos (tax, envío, importación, Amazon).
- Al cambiar `tipoItem` a `PRODUCTO`: aparece el selector de `fuenteCompra`.

**Selector de fuente de compra:**
- `LOCAL`: Solo muestra precio + envío. Tax US = oculto, Amazon = oculto, Importación = oculto.
- `AMAZON`: Muestra todos los campos. Amazon fee se calcula automáticamente. Tax se puede auto-calcular al 7%.
- `EXTERIOR_OTRO`: Muestra precio, tax, envío, importación. Sin campo de Amazon.

**Ejemplo de hook con Ítem Inteligente:**

```typescript
// hooks/useItemsManager.ts
export function useItemsManager(initialItems?: ItemInput[]) {
  const [items, setItems] = useState<ItemInput[]>(
    initialItems?.length ? initialItems : [{ ...makeItem(), id: "1" }]
  );
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const agregarItem = () => { /* ... */ };
  const eliminarItem = (id: string) => { /* ... */ };
  const updateItem = <K extends keyof ItemInput>(id: string, field: K, value: ItemInput[K]) => { /* ... */ };
  const toggleExpanded = (id: string) => { /* ... */ };

  const updateItemTipo = (id: string, tipoItem: TipoItem, fuenteCompra?: FuenteCompra) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const fuente = fuenteCompra ?? item.fuenteCompra ?? "LOCAL";
      const defaults = getItemDefaults(tipoItem, fuente);
      return { ...item, tipoItem, fuenteCompra: fuente, ...defaults };
    }));
  };

  return { items, setItems, expandedItems, agregarItem, eliminarItem, updateItem, updateItemTipo, toggleExpanded };
}
```

**Principio:** Cada componente recibe props, no accede a estado global. Los custom hooks encapsulan la lógica de estado y se combinan en el orchestrator `CotizacionForm.tsx`.

### B.2 Patrones de Server Actions con Validación Zod

**Problema actual:** Los server actions en `actions/documents.ts` y `actions/customers.ts` no validan input. Cualquier dato puede llegar a Prisma.

**Solución — Schemas Zod + safeParse:**

```typescript
// src/lib/validations/document.ts
import { z } from "zod";

export const saveDocumentSchema = z.object({
  tipo: z.enum(["COTIZACION", "FACTURA"]),
  clienteId: z.string().cuid(),
  items: z.array(z.object({
    descripcion: z.string().min(1, "La descripción es requerida"),
    cantidad: z.number().int().positive("La cantidad debe ser > 0"),
    precioUnitarioBase: z.number().nonnegative("El precio no puede ser negativo"),
    tipoItem: z.enum(["PRODUCTO", "SERVICIO"]),
    fuenteCompra: z.enum(["LOCAL", "AMAZON", "EXTERIOR_OTRO"]),
    precioOriginal: z.number().nonnegative().optional(),
    monedaOriginal: z.string().max(5).optional(),
    grupoId: z.string().optional(),
    aplicaTax: z.boolean(),
    taxUnitario: z.number().nonnegative(),
    envioUnitario: z.number().nonnegative(),
    promocionEnvioUnitario: z.number().nonnegative(),
    importacionUnitario: z.number().nonnegative(),
    aplicaAmazon: z.boolean(),
    // campos calculados
    amazonUnitarioCalculado: z.number().nonnegative(),
    costoUnitarioFinal: z.number().nonnegative(),
    subtotalLinea: z.number().nonnegative(),
  })).min(1, "Debe tener al menos un ítem"),
  totales: z.object({
    subtotal: z.number().nonnegative(),
    totalTax: z.number().nonnegative(),
    totalEnvio: z.number().nonnegative(),
    totalPromocionEnvio: z.number().nonnegative(),
    totalImportacion: z.number().nonnegative(),
    totalAmazon: z.number().nonnegative(),
    totalFinal: z.number().nonnegative(),
  }),
  observaciones: z.string().optional(),
  cotizacionOrigenId: z.string().cuid().optional(),
  margenPorcentaje: z.number().nonnegative().optional(),
  margenTipo: z.enum(["base", "total"]).optional(),
  margenRedondeo: z.union([z.literal(0), z.literal(1000), z.literal(5000)]).optional(),
});

export const createCustomerSchema = z.object({
  nombres: z.string().min(1, "El nombre es requerido").max(200),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  notas: z.string().max(1000).optional(),
});

export const upsertSellerSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(200),
  profesion: z.string().max(100).optional(),
  direccion: z.string().max(300).optional(),
  celular: z.string().max(30).optional(),
  email: z.string().email().optional().or(z.literal("")),
  identificacion: z.string().max(50).optional(),
});
```

**Patrón en server actions:**

```typescript
// Cada server action sigue este patrón:
export async function saveDocument(data: unknown) {
  // 1. Validar
  const parsed = saveDocumentSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: "Datos inválidos", details: parsed.error.flatten() };
  }
  
  // 2. Ejecutar lógica de negocio
  // ... código Prisma ...
  
  // 3. Revalidar cache
  revalidatePath("/documentos");
  revalidatePath("/");
  
  // 4. Retornar resultado tipado
  return { success: true, document: result };
}
```

**Archivos nuevos:**
- `src/lib/validations/document.ts` — Schemas para documentos
- `src/lib/validations/customer.ts` — Schemas para clientes
- `src/lib/validations/seller.ts` — Schemas para vendedor

### B.3 Manejo de Errores

**B.3.1 Server Action Error Handling**

**Problema actual:** 5 instancias de `catch {}` silenciosos en `documents.ts` (líneas 99, 334, 405, 408, 438, 457).

**Solución — Clase de error estructurada:**

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} no encontrado`, "NOT_FOUND", 404, { resource, id });
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 400, details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}
```

**Patrón en server actions:**

```typescript
// Reemplazar catch {} silenciosos con logging estructurado:
export async function updateDocument(id: string, data: unknown) {
  try {
    const parsed = updateDocumentSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: "Datos inválidos", details: parsed.error.flatten() };
    }
    
    // ... lógica ...
    revalidatePath("/documentos");
    revalidatePath(`/documentos/${id}`);
    return { success: true };
  } catch (error) {
    console.error("[updateDocument] Error:", error);
    // Si es un error conocido, propagar mensaje específico
    if (error instanceof AppError) {
      return { success: false, error: error.message };
    }
    // Error inesperado — mensaje genérico al usuario
    return { success: false, error: "Error inesperado al actualizar el documento." };
  }
}
```

**B.3.2 Error Boundaries (loading.tsx / error.tsx / not-found.tsx)**

**Problema actual:** No existe ningún archivo `loading.tsx`, `error.tsx`, ni `not-found.tsx` en ninguna ruta. Si un server component falla, el usuario ve una pantalla de error genérica de Next.js.

**Archivos nuevos a crear:**

```
src/app/
├── error.tsx                          → Error boundary global
├── not-found.tsx                      → 404 global
├── loading.tsx                        → Loading skeleton global
├── documentos/
│   ├── loading.tsx                    → Skeleton de tabla de documentos
│   ├── error.tsx                      → Error con retry
│   └── [id]/
│       ├── loading.tsx                → Skeleton de detalle
│       └── not-found.tsx              → "Documento no encontrado"
├── cotizaciones/
│   ├── nueva/
│   │   └── loading.tsx               → Skeleton del formulario
│   └── [id]/
│       ├── editar/
│       │   └── loading.tsx           → Skeleton del formulario edición
│       └── not-found.tsx
├── facturas/
│   ├── nueva/
│   │   └── loading.tsx
│   └── [id]/
│       └── editar/
│           └── loading.tsx
└── configuracion/
    └── loading.tsx
```

**Ejemplo `error.tsx` global:**

```typescript
"use client";

import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-400/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-[var(--text-0)] mb-2">Algo salió mal</h2>
      <p className="text-sm text-[var(--text-2)] max-w-md mb-6">
        Ocurrió un error inesperado. Puedes intentar de nuevo.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-[oklch(0.090_0.025_255)] font-bold rounded-xl transition-all text-sm"
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
```

### B.4 Sistema de Numeración Secuencial

**Problema actual:** La numeración usa `Date.now().toString().slice(-6)` (línea 55 de `documents.ts`), generando números como `COT-837291`. Esto:
- No es secuencial (no se puede ordenar cronológicamente por número)
- Puede colisionar si dos documentos se crean en el mismo milisegundo
- No es profesional para un sistema comercial

**Solución — Tabla `DocumentSequence` + Transacción atómica:**

```prisma
// Agregar al schema.prisma:
model DocumentSequence {
  id     String @id @default(cuid())
  tipo   String @unique // "COTIZACION" o "FACTURA"
  año    Int
  secuencia Int @default(0)
  updatedAt DateTime @updatedAt
}
```

**Service de numeración:**

```typescript
// src/lib/services/numbering.ts
import prisma from "@/lib/prisma";

export async function generarNumeroDocumento(tipo: "COTIZACION" | "FACTURA"): Promise<string> {
  const prefijo = tipo === "COTIZACION" ? "COT" : "FAC";
  const año = new Date().getFullYear();
  
  const result = await prisma.documentSequence.upsert({
    where: { tipo },
    update: { secuencia: { increment: 1 } },
    create: { tipo, año, secuencia: 1 },
  });
  
  // Formato: COT-2026-0001, FAC-2026-0001
  return `${prefijo}-${año}-${String(result.secuencia).padStart(4, "0")}`;
}
```

**Reemplazar en `saveDocument`:**
```typescript
// ANTES:
const randomNumero = `${data.tipo === "COTIZACION" ? "COT" : "FAC"}-${Date.now().toString().slice(-6)}`;

// DESPUÉS:
const numero = await generarNumeroDocumento(data.tipo);
```

### B.5 Eliminar SQL Crudo ($executeRaw / $queryRaw)

**Problema actual:** 13 instancias de `$executeRaw` y `$queryRaw` en `documents.ts`. Los comentarios dicen "compatible con Prisma client sin regenerar" pero esto es insostenible y propenso a errores.

**Causa raíz:** Las columnas `margenPorcentaje`, `margenTipo`, `margenRedondeo`, `cotizacionOrigenId` ya ESTÁN en el schema Prisma (schema.prisma líneas 57-62, 67-69). El raw SQL es innecesario — Prisma ya las maneja.

**Plan de eliminación:**

| # | Método actual (raw SQL) | Reemplazo con Prisma ORM |
|---|------------------------|--------------------------|
| 1 | `$executeRaw` UPDATE margen en `saveDocument` (L92-98) | Incluir `margenPorcentaje`, `margenTipo`, `margenRedondeo` directamente en `prisma.commercialDocument.create({ data: { ... } })` |
| 2 | `$executeRaw` UPDATE cotizacionOrigenId (L104-108) | Incluir `cotizacionOrigenId` en el `create` |
| 3 | `$executeRaw` UPDATE estado a FACTURADA (L109-113) | `prisma.commercialDocument.update({ where: { id }, data: { estado: "FACTURADA" } })` |
| 4 | `$queryRaw` SELECT cotizacionOrigenId (L180-183) | Prisma ya lo incluye con `include` o `select` |
| 5 | `$queryRaw` SELECT cotización origen (L188-192) | `prisma.commercialDocument.findUnique` con `select` |
| 6 | `$queryRaw` SELECT facturas generadas (L197-203) | `prisma.commercialDocument.findMany({ where: { cotizacionOrigenId: id } })` |
| 7 | `$queryRaw` COUNT facturas vinculadas (L272-279) | `prisma.commercialDocument.count({ where: { cotizacionOrigenId: { in: ids } } })` con `groupBy` |
| 8 | `$queryRaw` SELECT margen en `getDocumentForEdit` (L324-334) | `prisma.commercialDocument.findUnique({ select: { margenPorcentaje: true, ... } })` |
| 9 | `$executeRaw` UPDATE margen en `updateDocument` (L398-405) | Incluir margen en `prisma.commercialDocument.update({ data: { ... } })` |
| 10 | `$queryRaw` SELECT linked facturas en `deleteDocument` (L417-419) | `prisma.commercialDocument.count({ where: { cotizacionOrigenId: id } })` |
| 11 | `$queryRaw` SELECT cotizacionOrigenId en `deleteDocument` (L425-427) | `prisma.commercialDocument.findUnique({ select: { cotizacionOrigenId: true } })` |
| 12 | `$executeRaw` UPDATE estado en `deleteDocument` (L430-432) | `prisma.commercialDocument.update({ data: { estado: "BORRADOR" } })` |
| 13 | `$queryRaw` SELECT estado en `archiveDocument` (L448-449) | `prisma.commercialDocument.findUnique({ select: { estado: true } })` |

**Después de la refactorización:** Cero `$executeRaw` / `$queryRaw` en el código.

### B.6 Data Fetching Patterns

**Principio:** Server Components para lectura, Client Components para interactividad.

| Componente | Actual | Recomendado |
|-----------|--------|-------------|
| `page.tsx` (todas) | ✅ Server Component | Mantener — fetch directo con Prisma |
| `CotizacionForm.tsx` | ✅ Client Component ("use client") | Mantener — necesita `useState`, `useRouter` |
| `DocumentsClient.tsx` | ✅ Client Component | Mantener — filtra en cliente con `useMemo` |
| `NavBar.tsx` | ✅ Client Component | Mantener — `usePathname`, menú toggle |
| `CotizacionPDF.tsx` | ✅ Server-compatible | Mantener — `@react-pdf/renderer` no usa hooks |

**Mejora clave:** Agregar `Suspense` boundaries para streaming:

```typescript
// app/documentos/page.tsx
import { Suspense } from "react";

export default async function DocumentosPage() {
  return (
    <Suspense fallback={<DocumentsSkeleton />}>
      <DocumentsContent />
    </Suspense>
  );
}

async function DocumentsContent() {
  const docs = await getDocuments();
  return <DocumentsClient docs={docs} />;
}
```

### B.7 `revalidatePath` en Server Actions

**Problema actual:** Ningún server action llama `revalidatePath()` o `revalidateTag()`. Después de crear/editar/eliminar documentos, las listas muestran datos stale hasta que el usuario hace refresh manual.

**Solución — Agregar `revalidatePath` a cada server action de mutación:**

```typescript
import { revalidatePath } from "next/cache";

// saveDocument → después de crear:
revalidatePath("/documentos");
revalidatePath("/");

// updateDocument → después de actualizar:
revalidatePath("/documentos");
revalidatePath(`/documentos/${id}`);

// deleteDocument → después de eliminar:
revalidatePath("/documentos");
revalidatePath("/");

// archiveDocument → después de archivar:
revalidatePath("/documentos");
revalidatePath(`/documentos/${id}`);

// upsertSellerProfile → después de guardar:
revalidatePath("/configuracion");
revalidatePath("/"); // El seller aparece en PDFs

// createCustomer → no necesita revalidate (se usa inline)
```

---

## C) Estructura de Archivos Propuesta

### C.1 Estructura Actual

```
src/
├── app/
│   ├── actions/
│   │   ├── customers.ts
│   │   ├── documents.ts
│   │   └── seller.ts
│   ├── configuracion/
│   │   └── page.tsx
│   ├── cotizaciones/
│   │   ├── [id]/editar/page.tsx
│   │   └── nueva/page.tsx
│   ├── documentos/
│   │   ├── [id]/page.tsx
│   │   └── page.tsx
│   ├── facturas/
│   │   ├── [id]/editar/page.tsx
│   │   └── nueva/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── configuracion/
│   │   └── SellerProfileForm.tsx
│   ├── cotizaciones/
│   │   ├── CotizacionForm.tsx        ← 1,389 líneas
│   │   └── ImportarCotizacionModal.tsx
│   ├── documentos/
│   │   ├── DocumentActionsClient.tsx
│   │   ├── DocumentDetailClient.tsx
│   │   └── DocumentsClient.tsx
│   ├── layout/
│   │   ├── NavBar.tsx
│   │   └── ThemeProvider.tsx
│   ├── pdf/
│   │   ├── ClientPDFViewer.tsx
│   │   └── CotizacionPDF.tsx
│   └── ui/
│       ├── button.tsx ... (9 archivos shadcn)
├── lib/
│   ├── calculator.ts
│   ├── prisma.ts
│   └── utils.ts
```

### C.2 Estructura Propuesta (nuevos archivos marcados con 🆕)

```
src/
├── app/
│   ├── actions/
│   │   ├── customers.ts              (refactor: agregar CRUD completo + Zod)
│   │   ├── documents.ts              (refactor: eliminar raw SQL, Zod, revalidatePath, nuevos campos)
│   │   ├── seller.ts                 (refactor: Zod, revalidatePath)
│   │   └── settings.ts              🆕 (AppSetting CRUD)
│   ├── configuracion/
│   │   ├── page.tsx
│   │   ├── loading.tsx              🆕
│   │   └── clientes/
│   │       └── page.tsx             🆕 (gestión completa de clientes)
│   ├── cotizaciones/
│   │   ├── [id]/
│   │   │   ├── editar/
│   │   │   │   └── page.tsx
│   │   │   │   └── loading.tsx      🆕
│   │   │   └── not-found.tsx        🆕
│   │   └── nueva/
│   │       ├── page.tsx
│   │       └── loading.tsx          🆕
│   ├── documentos/
│   │   ├── [id]/
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx          🆕
│   │   │   └── not-found.tsx        🆕
│   │   ├── page.tsx
│   │   ├── loading.tsx              🆕
│   │   └── error.tsx                🆕
│   ├── facturas/
│   │   ├── [id]/
│   │   │   ├── editar/
│   │   │   │   └── page.tsx
│   │   │   │   └── loading.tsx      🆕
│   │   │   └── not-found.tsx        🆕
│   │   └── nueva/
│   │       ├── page.tsx
│   │       └── loading.tsx          🆕
│   ├── error.tsx                    🆕 (global)
│   ├── not-found.tsx                🆕 (global)
│   ├── loading.tsx                  🆕 (global skeleton)
│   ├── globals.css
│   ├── layout.tsx                   (modificar: agregar Toaster)
│   └── page.tsx                     (refactor: dashboard mejorado)
│
├── components/
│   ├── configuracion/
│   │   ├── SellerProfileForm.tsx     (refactor: react-hook-form + Zod)
│   │   └── AppSettingsForm.tsx      🆕
│   ├── cotizaciones/
│   │   ├── CotizacionForm.tsx        (refactor: orchestrator ~200 líneas)
│   │   ├── ImportarCotizacionModal.tsx
│   │   ├── items/                   🆕
│   │   │   ├── ItemsTable.tsx
│   │   │   ├── ItemsMobileCards.tsx
│   │   │   ├── ItemRowDesktop.tsx
│   │   │   ├── ItemCardMobile.tsx
│   │   │   ├── ItemChargeInputs.tsx
│   │   │   ├── ItemTipoSelector.tsx   🆕 (selector tipoItem + fuenteCompra)
│   │   │   └── ItemGroupLabel.tsx     🆕 (etiqueta de grupo para PC ensamblada)
│   │   ├── customer/                🆕
│   │   │   ├── CustomerSection.tsx
│   │   │   └── CustomerAutocomplete.tsx
│   │   ├── summary/                 🆕
│   │   │   ├── SummaryPanel.tsx
│   │   │   ├── MarginPanel.tsx
│   │   │   ├── SavedDocSuccess.tsx
│   │   │   └── SummaryLineItem.tsx
│   │   └── shared/                  🆕
│   │       └── SectionHeader.tsx
│   ├── documentos/
│   │   ├── DocumentActionsClient.tsx (refactor: toasts)
│   │   ├── DocumentDetailClient.tsx
│   │   └── DocumentsClient.tsx      (refactor: usar fmtDec de utils)
│   ├── clientes/                    🆕
│   │   ├── ClientesTable.tsx
│   │   ├── ClienteForm.tsx
│   │   └── ClienteDialog.tsx
│   ├── layout/
│   │   ├── NavBar.tsx               (refactor: agregar link a Clientes)
│   │   └── ThemeProvider.tsx
│   ├── pdf/
│   │   ├── ClientPDFViewer.tsx       (refactor: usar fmtMoney)
│   │   └── CotizacionPDF.tsx        (refactor: usar fmtMoney, settings, mostrar tipoItem/fuenteCompra)
│   ├── ui/
│   │   ├── button.tsx ... (existentes)
│   │   ├── sonner.tsx              🆕 (shadcn wrapper)
│   │   ├── badge.tsx               🆕 (para tipoItem/fuenteCompra en PDF)
│   │   ├── skeleton.tsx            🆕 (para loading states)
│   │   └── spinner.tsx             🆕 (spinner reutilizable)
│   └── dashboard/                   🆕
│       ├── DashboardMetrics.tsx
│       ├── RecentDocuments.tsx
│       └── QuickActions.tsx
│
├── lib/
│   ├── calculator.ts               (refactor: hot fix Amazon, nuevos campos tipoItem/fuenteCompra, ItemInput expandido)
│   ├── prisma.ts                   (sin cambios)
│   ├── utils.ts                    (agregar fmtMoney, fmtMoneyDec)
│   ├── errors.ts                   🆕 (AppError, NotFoundError, etc.)
│   ├── validations/                🆕
│   │   ├── document.ts             (schemas Zod con nuevos campos)
│   │   ├── customer.ts
│   │   └── seller.ts
│   └── services/                   🆕
│       ├── numbering.ts            (generarNumeroDocumento)
│       └── settings.ts             (getSetting, setSetting)
│
├── hooks/                          🆕
│   ├── use-items-manager.ts        (con soporte para tipoItem/fuenteCompra/grupoId)
│   ├── use-customer-autocomplete.ts
│   ├── use-document-calculations.ts
│   ├── use-margin-config.ts
│   └── use-document-save.ts
│
└── types/                          🆕 (tipos globales compartidos)
    └── index.ts                    (TipoItem, FuenteCompra, ItemInput, etc.)
```

### C.3 Cambios al Schema Prisma (para Supabase/PostgreSQL)

```prisma
// datasource db {
//   provider = "postgresql"              ← Cambiar de sqlite a postgresql
//   url      = env("DATABASE_URL")       ← Usar variable de entorno
// }

// Agregar modelo de secuencias:
model DocumentSequence {
  id        String   @id @default(cuid())
  tipo      String   @unique // "COTIZACION" o "FACTURA"
  año       Int
  secuencia Int      @default(0)
  updatedAt DateTime @updatedAt
}

// NUEVOS CAMPOS en CommercialDocumentItem:
// - tipoItem       String    @default("PRODUCTO")   // "PRODUCTO" | "SERVICIO"
// - fuenteCompra   String    @default("LOCAL")       // "LOCAL" | "AMAZON" | "EXTERIOR_OTRO"
// - precioOriginal Float?                            // Precio en moneda original (ej. USD)
// - monedaOriginal String?                            // "USD", "COP"
// - grupoId        String?                           // Para agrupar partes de una PC ensamblada

// Ejemplo de migración:
// ALTER TABLE "CommercialDocumentItem" ADD COLUMN "tipoItem" TEXT NOT NULL DEFAULT 'PRODUCTO';
// ALTER TABLE "CommercialDocumentItem" ADD COLUMN "fuenteCompra" TEXT NOT NULL DEFAULT 'LOCAL';
// ALTER TABLE "CommercialDocumentItem" ADD COLUMN "precioOriginal" DOUBLE PRECISION;
// ALTER TABLE "CommercialDocumentItem" ADD COLUMN "monedaOriginal" TEXT;
// ALTER TABLE "CommercialDocumentItem" ADD COLUMN "grupoId" TEXT;

// Eliminar campos de 4x1000 del schema (excluido del alcance):
// - total4x1000 en CommercialDocument
// - aplica4x1000 en CommercialDocumentItem
// - valor4x1000Linea en CommercialDocumentItem
// NOTA: Esto se hace en una migración separada tras eliminar referencias en código.
```

---

## D) Mejoras por Módulo

### D.1 Módulo: Cotizaciones

| # | Mejora | Detalle | Prioridad |
|---|--------|---------|-----------|
| C-1 | Refactorizar CotizacionForm | Descomponer en 8+ sub-componentes (ver B.1) | 🔴 Alta |
| C-2 | Eliminar raw SQL | Reemplazar `$executeRaw`/`$queryRaw` con Prisma ORM (ver B.5) | 🔴 Alta |
| C-3 | Numeración secuencial | Implementar `DocumentSequence` (ver B.4) | 🔴 Alta |
| C-4 | Validación Zod | Schemas para `saveDocument`, `updateDocument` (con nuevos campos tipoItem, fuenteCompra, etc.) | 🟡 Media |
| C-5 | `revalidatePath` | Agregar a `saveDocument` y `updateDocument` | 🔴 Alta |
| C-6 | Toast notifications | Reemplazar `setFormError` con `toast.error()` | 🟡 Media |
| C-7 | Loading skeleton | `loading.tsx` para `/cotizaciones/nueva` | 🟢 Baja |
| C-8 | Not-found page | Para rutas `/cotizaciones/[id]` inválidas | 🟢 Baja |
| C-9 | **Ítem Inteligente** | Selector tipoItem + fuenteCompra con UI adaptativa (ver B.1) | 🔴 Alta |
| C-10 | **Agrupación por grupoId** | Visualización de PC ensamblada con partes de fuentes mixtas | 🟡 Media |

### D.2 Módulo: Facturas

| # | Mejora | Detalle | Prioridad |
|---|--------|---------|-----------|
| F-1 | Mismas mejoras que cotizaciones | Comparte `CotizacionForm` y `documents.ts` | 🔴 Alta |
| F-2 | searchParams con nuqs | Reemplazar parseo manual de `fromCotizacion` | 🟡 Media |
| F-3 | Loading skeleton | Para `/facturas/nueva` y editar | 🟢 Baja |

### D.3 Módulo: Clientes

**Problema actual:** Solo existe `createCustomer` y `searchCustomers` en `customers.ts`. No hay edición, eliminación ni listado de clientes.

**Mejoras:**

| # | Mejora | Detalle | Prioridad |
|---|--------|---------|-----------|
| CL-1 | CRUD completo de server actions | `updateCustomer`, `deleteCustomer`, `getCustomers`, `getCustomerById` | 🔴 Alta |
| CL-2 | Página de gestión de clientes | `/configuracion/clientes` con tabla, búsqueda, paginación | 🟡 Media |
| CL-3 | Formulario de edición | Modal o página para editar datos del cliente | 🟡 Media |
| CL-4 | Validación Zod | `createCustomerSchema`, `updateCustomerSchema` | 🟡 Media |
| CL-5 | Soft delete o confirmación | Prevenir eliminación de clientes con documentos | 🟢 Baja |

**Nuevos server actions para `customers.ts`:**

```typescript
export async function getCustomers(params?: { search?: string; page?: number; limit?: number }) { ... }
export async function getCustomerById(id: string) { ... }
export async function updateCustomer(id: string, data: { nombres?: string; email?: string; ... }) { ... }
export async function deleteCustomer(id: string) {
  // Verificar que no tenga documentos antes de eliminar
  const docCount = await prisma.commercialDocument.count({ where: { customerId: id } });
  if (docCount > 0) return { success: false, error: "El cliente tiene documentos asociados." };
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/configuracion/clientes");
  return { success: true };
}
```

### D.4 Módulo: Documentos

| # | Mejora | Detalle | Prioridad |
|---|--------|---------|-----------|
| D-1 | Eliminar raw SQL | Ver B.5 — 13 instancias | 🔴 Alta |
| D-2 | `revalidatePath` | En todas las mutaciones | 🔴 Alta |
| D-3 | Error boundaries | `error.tsx`, `loading.tsx`, `not-found.tsx` | 🟡 Media |
| D-4 | Toast en acciones | Archivar/eliminar con feedback visual | 🟡 Media |
| D-5 | Extracción de `fmtDec` | Usar `fmtMoney` de `lib/utils.ts` | 🟡 Media |
| D-6 | Estado ENVIADO en flujo | Agregar transiciones de estado válidas | 🟢 Baja |

### D.5 Módulo: Configuración

**Problema actual:** El modelo `AppSetting` existe en el schema (líneas 94-100) pero no se usa en ningún archivo.

| # | Mejora | Detalle | Prioridad |
|---|--------|---------|-----------|
| CF-1 | Implementar AppSettings | Server actions `getSetting()`, `setSetting()` | 🟡 Media |
| CF-2 | Settings por defecto | Seed de `validez_cotizacion_dias: 15`, `moneda: COP`, `tax_us_rate: 0.07`, `amazon_fee_rate: 0.0225` | 🟡 Media |
| CF-3 | Formulario de settings | `AppSettingsForm.tsx` en configuración | 🟡 Media |
| CF-4 | Usar settings en PDF | Reemplazar hardcode `15 días` con `getSetting("validez_cotizacion_dias")` | 🟡 Media |
| CF-5 | Seller con react-hook-form | Migrar `SellerProfileForm` a RHF + Zod | 🟢 Baja |

**Servicio de settings:**

```typescript
// src/lib/services/settings.ts
import prisma from "@/lib/prisma";

export async function getSetting(clave: string): Promise<string | null> {
  const setting = await prisma.appSetting.findUnique({ where: { clave } });
  return setting?.valor ?? null;
}

export async function getSettingNumber(clave: string, fallback = 0): Promise<number> {
  const val = await getSetting(clave);
  return val ? Number(val) : fallback;
}

export async function setSetting(clave: string, valor: string, descripcion?: string) {
  return prisma.appSetting.upsert({
    where: { clave },
    update: { valor },
    create: { clave, valor, descripcion },
  });
}
```

### D.6 Módulo: Dashboard

**Problema actual:** `page.tsx` (dashboard) muestra una lista simple de documentos recientes, sin métricas de negocio reales.

| # | Mejora | Detalle | Prioridad |
|---|--------|---------|-----------|
| DB-1 | Métricas clave | Total cotizaciones del mes, total facturado, clientes activos, promedio por documento | 🟡 Media |
| DB-2 | Gráficos simples | Barras de cotizaciones vs facturas por mes (sin librería extra — CSS bars) | 🟢 Baja |
| DB-3 | Desglose de estados | Cotizaciones en Borrador / Facturadas / Archivadas | 🟡 Media |
| DB-4 | Separar en sub-componentes | `DashboardMetrics.tsx`, `RecentDocuments.tsx`, `QuickActions.tsx` | 🟡 Media |
| DB-5 | Links a acciones rápidas | "Clientes recientes", "Cotizaciones por vencer" | 🟢 Baja |

**Ejemplo de métricas:**

```typescript
// En page.tsx (Server Component)
const [totalCotizaciones, totalFacturas, totalFacturadoMes, clientesActivos] = await Promise.all([
  prisma.commercialDocument.count({ where: { tipo: "COTIZACION", estado: { not: "ARCHIVADA" } } }),
  prisma.commercialDocument.count({ where: { tipo: "FACTURA", estado: { not: "ARCHIVADA" } } }),
  prisma.commercialDocument.aggregate({
    _sum: { totalFinal: true },
    where: { tipo: "FACTURA", fecha: { gte: inicioMes } },
  }),
  prisma.customer.count(),
]);
```

### D.7 Módulo: PDF

| # | Mejora | Detalle | Prioridad |
|---|--------|---------|-----------|
| P-1 | Extraer `fmtMoney` | Eliminar `const fmt = (val: number) => ...` local en CotizacionPDF.tsx (L278) | 🟡 Media |
| P-2 | Usar AppSettings | Validez de cotización desde BD, no hardcodeada | 🟡 Media |
| P-3 | Formatear fechas en PDF | Usar `date-fns` con locale `es` en lugar de `toLocaleDateString` nativo | 🟢 Baja |
| P-4 | Tipar mejor props | Interface compartida para evitar duplicación entre CotizacionPDF y ClientPDFViewer | 🟢 Baja |
| P-5 | **Mostrar origen y tipo de ítem** | Badge o texto indicando tipoItem (Producto/Servicio) y fuenteCompra (Local/Amazon/Exterior) | 🟡 Media |
| P-6 | **Mostrar moneda original** | Para ítems importados, mostrar precioOriginal + monedaOriginal (ej. "USD 45.00") | 🟡 Media |
| P-7 | **Agrupación visual por grupoId** | En PC ensamblada, separar visualmente los componentes del grupo | 🟢 Baja |

**Ejemplo de ítem en PDF con origen y tipo:**

```
┌─────────────────────────────────────────────────────┐
│ [Producto · Amazon]                                  │
│ NVIDIA RTX 4060                                     │
│ Precio: COP 1,250,000  (USD 280.00)                │
│ Tax US: COP 87,500  │  Envío: COP 45,000          │
│ Importación: COP 275,000  │  Amazon fee: COP 31.64 │
│ Cant: 1  │  Subtotal: COP 1,688,750               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ [Producto · Local]                                   │
│ Case Corsair 4000D                                   │
│ Precio: COP 350,000  │  Envío: COP 15,000         │
│ Cant: 1  │  Subtotal: COP 365,000                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ [Servicio]                                           │
│ Mantenimiento preventivo                             │
│ Precio: COP 80,000                                   │
│ Cant: 1  │  Subtotal: COP 80,000                    │
└─────────────────────────────────────────────────────┘
```

---

## E) Buenas Prácticas

### E.1 Configuración y Convenciones

| # | Práctica | Implementación |
|---|----------|----------------|
| 1 | **Utilidad compartida `fmtMoney`** | Agregar a `lib/utils.ts`:
```typescript
export const fmtMoney = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export const fmtMoneyDec = (n: number) =>
  n.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
``` | 
| 2 | **Eliminar `fmtDec` duplicado** | Remover las 7 instancias locales y usar `fmtMoney` / `fmtMoneyDec` de `@/lib/utils` |
| 3 | **Variables de entorno** | Crear `.env.local` con `DATABASE_URL` para PostgreSQL, agregar `.env.example` |
| 4 | **Migración PostgreSQL** | Ejecutar `prisma migrate dev` tras cambiar `datasource` a `postgresql` |
| 5 | **Convención de imports** | Ordenar imports: (1) React/Next, (2) librerías, (3) componentes, (4) tipos, (5) utils |
| 6 | **Precios en moneda original** | Para importaciones, siempre guardar `precioOriginal` y `monedaOriginal` como auditoría del tipo de cambio |

### E.2 Type Safety

| # | Práctica | Implementación |
|---|----------|----------------|
| 1 | **Tipos de retorno de Server Actions** | Ya se usan `Awaited<ReturnType<...>>` — mantener este patrón |
| 2 | **Zod schemas = source of truth** | Derivar tipos de schemas: `type SaveDocumentInput = z.infer<typeof saveDocumentSchema>` |
| 3 | **Enums en schema Prisma** | Cambiar `tipo String` a `tipo DocumentType` con `enum DocumentType { COTIZACION, FACTURA }` |
| 4 | **Enums para estado** | Cambiar `estado String` a `estado DocumentStatus` con `enum DocumentStatus { BORRADOR, ENVIADO, ACEPTADO, RECHAZADO, FACTURADA, ARCHIVADA }` |
| 5 | **Enums para tipoItem y fuenteCompra** | Agregar `enum TipoItem { PRODUCTO, SERVICIO }` y `enum FuenteCompra { LOCAL, AMAZON, EXTERIOR_OTRO }` al schema Prisma |
| 6 | **Strict null checks** | `tsconfig.json` ya tiene `strict: true` — asegurarse de que no haya `!` assertions injustificadas |

### E.3 Performance

| # | Práctica | Implementación |
|---|----------|----------------|
| 1 | **Dynamic imports para PDF** | Ya se usa `dynamic(() => import(...), { ssr: false })` — correcto |
| 2 | **`Promise.all` para fetch paralelo** | Ya se usa en editar pages — mantener |
| 3 | **Pagination en `getDocuments`** | Agregar `skip`/`take` con paginación real cuando los documentos crezcan |
| 4 | **Debounce en búsqueda** | El autocompletado ya tiene debounce de 300ms — mantener |
| 5 | **Optimistic updates** | El archivar ya usa optimistic UI — mantener y expandir a eliminar |

### E.4 UX / Diseño

| # | Práctica | Implementación |
|---|----------|----------------|
| 1 | **Toast notifications** | `sonner` para feedback de acciones (guardar, eliminar, archivar) |
| 2 | **Loading skeletons** | Skeletons consistentes con el diseño actual (bordes rounded-2xl, colores surface-1) |
| 3 | **Confirmación antes de salir** | `beforeunload` si hay datos sin guardar en el formulario |
| 4 | **Breadcrumbs en todas las páginas** | Ya se usan — mantener como patrón consistente |
| 5 | **Empty states** | Ya hay buenos empty states — mantener el estilo |
| 6 | **Accesibilidad** | Agregar `aria-label` a botones icon-only, `role="alert"` a errores de formulario |
| 7 | **Responsive** | Ya hay versión mobile/desktop — mantener |
| 8 | **Ítem Inteligente visual** | Al cambiar tipoItem/fuenteCompra, animar la aparición/desaparición de campos con transiciones suaves |

---

## F) Cronograma

### Fase 0: HOT FIX — Bug Crítico de Amazon Fee (0.5 días)

**Objetivo:** Corregir el cálculo incorrecto de Amazon fee que afecta todas las cotizaciones actuales.

| # | Tarea | Esfuerzo | Archivos principales |
|---|-------|----------|---------------------|
| 0.1 | Corregir base de garantía en `calcularItem()` | 0.5h | `src/lib/calculator.ts` (línea 74) |
| 0.2 | Actualizar comentarios explicativos | 0.25h | `src/lib/calculator.ts` |
| 0.3 | Verificar manualmente con cotizaciones existentes | 0.5h | Test manual |
| 0.4 | Revisar cotizaciones guardadas con fee incorrecto | 0.5h | BD — evaluar si necesita corrección retroactiva |

**Total estimado:** ~1.75 horas

### Fase 1: Fundamentos y Nuevos Campos de Negocio (3-4 días)

**Objetivo:** Resolver problemas técnicos urgentes + agregar campos de tipoItem/fuenteCompra al modelo de datos.

| # | Tarea | Esfuerzo | Archivos principales |
|---|-------|----------|---------------------|
| 1.1 | Agregar `fmtMoney`/`fmtMoneyDec` a `lib/utils.ts` y eliminar duplicados | 1h | `lib/utils.ts`, 7 archivos que usan `fmtDec` local |
| 1.2 | Crear `lib/errors.ts` con clases de error | 1h | `lib/errors.ts` (nuevo) |
| 1.3 | Agregar enums `TipoItem`, `FuenteCompra` a `types/index.ts` | 0.5h | `types/index.ts` (nuevo) |
| 1.4 | Expandir `ItemInput` en calculator.ts con nuevos campos | 1h | `src/lib/calculator.ts` |
| 1.5 | Implementar `getItemDefaults()` y nuevo flujo en `calcularItem()` | 1.5h | `src/lib/calculator.ts` |
| 1.6 | Agregar campos nuevos al schema Prisma + migración | 1.5h | `prisma/schema.prisma`, `app/actions/documents.ts` |
| 1.7 | Crear schemas Zod en `lib/validations/` (con nuevos campos) | 2h | `validations/document.ts`, `customer.ts`, `seller.ts` (nuevos) |
| 1.8 | Eliminar raw SQL de `documents.ts` | 3h | `app/actions/documents.ts` |
| 1.9 | Agregar `revalidatePath` a todas las mutaciones | 1h | `app/actions/documents.ts`, `seller.ts`, `customers.ts` |
| 1.10 | Implementar numeración secuencial | 2h | `lib/services/numbering.ts` (nuevo), `prisma/schema.prisma`, `app/actions/documents.ts` |
| 1.11 | Agregar `revalidatePath` + validación Zod a server actions | 2h | Todos los archivos de actions |
| 1.12 | Eliminar librerías no usadas (`@base-ui/react`, `@radix-ui/react-icons`) | 0.5h | `package.json` |

**Total estimado:** ~17 horas

### Fase 2: Refactorización del Formulario + Ítem Inteligente (4-5 días)

**Objetivo:** Descomponer el monolito CotizacionForm en componentes manejables + implementar UI adaptativa.

| # | Tarea | Esfuerzo | Archivos principales |
|---|-------|----------|---------------------|
| 2.1 | Crear custom hooks (con soporte tipoItem/fuenteCompra) | 2.5h | `hooks/use-items-manager.ts`, `use-customer-autocomplete.ts`, `use-document-calculations.ts`, `use-margin-config.ts`, `use-document-save.ts` |
| 2.2 | Crear `ItemTipoSelector` (selector tipoItem + fuenteCompra) | 1.5h | `components/cotizaciones/items/ItemTipoSelector.tsx` (nuevo) |
| 2.3 | Crear `ItemGroupLabel` para PC ensamblada | 1h | `components/cotizaciones/items/ItemGroupLabel.tsx` (nuevo) |
| 2.4 | Extraer componentes de ítems (con lógica de visibilidad) | 3.5h | `components/cotizaciones/items/` (5+ archivos nuevos) |
| 2.5 | Extraer componentes de cliente | 1h | `components/cotizaciones/customer/` (2 archivos nuevos) |
| 2.6 | Extraer componentes de resumen | 2h | `components/cotizaciones/summary/` (4 archivos nuevos) |
| 2.7 | Refactorizar orchestrator `CotizacionForm.tsx` | 2h | `CotizacionForm.tsx` (reducir a ~200 líneas) |
| 2.8 | Verificar que editar/nueva sigan funcionando con nuevos campos | 1.5h | Páginas de rutas |
| 2.9 | Agregar `toast` de sonner al formulario | 0.5h | `CotizacionForm.tsx`, `layout.tsx` |

**Total estimado:** ~15.5 horas

### Fase 3: Error Boundaries y UX (2 días)

**Objetivo:** Agregar manejo de errores visual y loading states.

| # | Tarea | Esfuerzo | Archivos principales |
|---|-------|----------|---------------------|
| 3.1 | Instalar y configurar `sonner` | 0.5h | `layout.tsx`, `components/ui/sonner.tsx` |
| 3.2 | Crear `error.tsx` global | 0.5h | `app/error.tsx` (nuevo) |
| 3.3 | Crear `not-found.tsx` global | 0.5h | `app/not-found.tsx` (nuevo) |
| 3.4 | Crear loading skeletons por ruta | 2h | 8 archivos `loading.tsx` nuevos |
| 3.5 | Crear `not-found.tsx` por recurso | 1h | 3 archivos `not-found.tsx` en rutas dinámicas |
| 3.6 | Agregar `error.tsx` en `/documentos` | 0.5h | `app/documentos/error.tsx` (nuevo) |
| 3.7 | Mejorar `DocumentActionsClient` con toasts | 0.5h | `DocumentActionsClient.tsx` |
| 3.8 | Agregar spinner component reutilizable | 0.5h | `components/ui/spinner.tsx` |

**Total estimado:** ~6 horas

### Fase 4: CRUD de Clientes, Configuración y PDF mejorado (3-4 días)

**Objetivo:** Completar gestión de clientes, settings, y mejorar PDF con origen/tipo de ítems.

| # | Tarea | Esfuerzo | Archivos principales |
|---|-------|----------|---------------------|
| 4.1 | Agregar CRUD completo a `customers.ts` | 2h | `app/actions/customers.ts` |
| 4.2 | Crear página `/configuracion/clientes` | 3h | `app/configuracion/clientes/page.tsx`, `components/clientes/` (3 componentes) |
| 4.3 | Implementar servicio de `AppSetting` | 1h | `lib/services/settings.ts` (nuevo), `app/actions/settings.ts` (nuevo) |
| 4.4 | Crear formulario de `AppSettings` | 2h | `components/configuracion/AppSettingsForm.tsx` (nuevo) |
| 4.5 | Usar settings en PDF y dashboard | 1h | `CotizacionPDF.tsx`, `page.tsx` |
| 4.6 | **Mejorar PDF: mostrar tipoItem y fuenteCompra** | 1.5h | `CotizacionPDF.tsx` |
| 4.7 | **Mejorar PDF: mostrar moneda original en importaciones** | 1h | `CotizacionPDF.tsx` |
| 4.8 | **Mejorar PDF: agrupación visual por grupoId** | 1h | `CotizacionPDF.tsx` |
| 4.9 | Agregar link a Clientes en NavBar | 0.5h | `NavBar.tsx` |

**Total estimado:** ~13 horas

### Fase 5: Dashboard y Polish (2 días)

**Objetivo:** Mejorar el dashboard y aplicar mejoras finales.

| # | Tarea | Esfuerzo | Archivos principales |
|---|-------|----------|---------------------|
| 5.1 | Refactorizar dashboard en sub-componentes | 2h | `components/dashboard/` (3 componentes) |
| 5.2 | Agregar métricas de negocio | 2h | `app/page.tsx`, `components/dashboard/DashboardMetrics.tsx` |
| 5.3 | Migrar `SellerProfileForm` a react-hook-form | 1h | `SellerProfileForm.tsx` |
| 5.4 | Agregar `nuqs` para searchParams | 1h | `facturas/nueva/page.tsx` |
| 5.5 | Mejorar enums en schema Prisma | 1h | `prisma/schema.prisma`, tipos derivados |
| 5.6 | Accesibilidad: aria-labels, roles | 1h | Componentes con botones icon-only |
| 5.7 | Crear `.env.example` | 0.5h | `.env.example` |
| 5.8 | Cleanup: imports no usados, variables | 1h | Todos los archivos |

**Total estimado:** ~9.5 horas

### Resumen de Esfuerzo Total

| Fase | Duración estimada | Prioridad |
|-------|------------------|-----------|
| **Fase 0:** HOT FIX Amazon Fee | 1.75 horas | 🔴 CRÍTICA (inmediata) |
| **Fase 1:** Fundamentos + Nuevos Campos | 17 horas | 🔴 Crítica |
| **Fase 2:** Formulario + Ítem Inteligente | 15.5 horas | 🔴 Alta |
| **Fase 3:** Error Boundaries y UX | 6 horas | 🟡 Media |
| **Fase 4:** Clientes, Config y PDF mejorado | 13 horas | 🟡 Media |
| **Fase 5:** Dashboard y Polish | 9.5 horas | 🟢 Baja |
| **TOTAL** | **~63 horas** | |

### Dependencias entre fases

```
Fase 0 ──→ Fase 1 ──→ Fase 2 ──→ Fase 3
                       ──→ Fase 4 (puede ir en paralelo con Fase 3)
                                ──→ Fase 5 (después de todas)
```

- **Fase 0** es INMEDIATA — se aplica antes que nada, sobre la rama actual
- **Fase 1** es prerrequisito de todas (fundamentos: Zod, utils, revalidation, nuevos campos)
- **Fase 2** depende de Fase 1 (los hooks usan los schemas Zod y los nuevos tipos)
- **Fase 3** puede empezar cuando Fase 2 está parcialmente lista
- **Fase 4** puede ir en paralelo con Fase 3
- **Fase 5** es la última (polish, requiere que todo lo demás esté estable)

---

## Apéndice A: Checklist de Verificación Post-Refactorización

- [ ] **Amazon fee calculado correctamente** (sin importacionUnitario en la base)
- [ ] **tipoItem y fuenteCompra** presentes en todos los ítems guardados
- [ ] **Formulario Inteligente:** campos correctos visibles según tipoItem + fuenteCompra
- [ ] **Productos locales pueden tener envío** (campo visible y funcional)
- [ ] **Servicios no muestran campos de costos** (tax, envío, importación, Amazon)
- [ ] Cero `$executeRaw` / `$queryRaw` en el código
- [ ] Cero `catch {}` silenciosos
- [ ] Cero duplicaciones de `fmtDec` / `fmt`
- [ ] Todos los server actions tienen validación Zod
- [ ] Todos los server actions de mutación tienen `revalidatePath`
- [ ] Todas las rutas tienen `loading.tsx`
- [ ] Todas las rutas dinámicas tienen `not-found.tsx`
- [ ] `error.tsx` global existe
- [ ] Toasts en lugar de `setFormError` manual
- [ ] `CotizacionForm.tsx` < 250 líneas
- [ ] Numeración secuencial (no `Date.now()`)
- [ ] CRUD completo de clientes
- [ ] `AppSetting` funcional
- [ ] Librerías no usadas eliminadas
- [ ] `.env.example` creado
- [ ] Funciona en PostgreSQL (Supabase)
- [ ] PDF muestra tipoItem, fuenteCompra y monedaOriginal
- [ ] Agrupación por grupoId funciona en formulario y PDF

---

## Apéndice B: Escenarios de Verificación del Cálculo

Estos escenarios DEBEN pasar después de la refactorización:

### Escenario 1: Pieza local con envío

| Campo | Valor |
|-------|-------|
| tipoItem | PRODUCTO |
| fuenteCompra | LOCAL |
| precioUnitarioBase | $350,000 COP |
| envioUnitario | $15,000 COP |
| **costoUnitarioFinal** | **$365,000 COP** |

### Escenario 2: Pieza importada de Amazon

| Campo | Valor |
|-------|-------|
| tipoItem | PRODUCTO |
| fuenteCompra | AMAZON |
| precioOriginal | $280.00 USD |
| monedaOriginal | USD |
| precioUnitarioBase | $1,250,000 COP |
| taxUnitario (7%) | $87,500 COP |
| envioUnitario | $45,000 COP |
| importacionUnitario | $275,000 COP |
| aplicaAmazon | true |
| **baseGarantia** | $1,250,000 + $87,500 + $45,000 = **$1,382,500** |
| **amazonUnitarioCalculado** | $1,382,500 × 0.0225 = **$31,106.25** |
| **costoUnitarioFinal** | $1,250,000 + $87,500 + $45,000 + $275,000 + $31,106.25 = **$1,688,606.25** |

### Escenario 3: Pieza importada de eBay

| Campo | Valor |
|-------|-------|
| tipoItem | PRODUCTO |
| fuenteCompra | EXTERIOR_OTRO |
| precioUnitarioBase | $980,000 COP |
| taxUnitario (7%) | $68,600 COP |
| envioUnitario | $35,000 COP |
| importacionUnitario | $210,000 COP |
| aplicaAmazon | false |
| **costoUnitarioFinal** | $980,000 + $68,600 + $35,000 + $210,000 = **$1,293,600 COP** |

### Escenario 4: Servicio de mantenimiento

| Campo | Valor |
|-------|-------|
| tipoItem | SERVICIO |
| fuenteCompra | (ignorado) |
| precioUnitarioBase | $80,000 COP |
| **costoUnitarioFinal** | **$80,000 COP** |

### Escenario 5: PC ensamblada con fuentes mixtas

| grupoId | tipoItem | fuenteCompra | descripcion | costoUnitarioFinal |
|---------|----------|--------------|-------------|--------------------|
| pc-001 | PRODUCTO | AMAZON | RTX 4060 | $1,688,606 |
| pc-001 | PRODUCTO | LOCAL | Case Corsair 4000D | $365,000 |
| pc-001 | PRODUCTO | EXTERIOR_OTRO | SSD Samsung 990 | $610,000 |
| — | SERVICIO | — | Armado y configuración | $120,000 |
| | | | **Total** | **$2,783,606** |

---

*Documento generado como guía de implementación. Cada item tiene suficiente detalle para que un desarrollador pueda implementarlo sin ambigüedad. Las reglas de negocio documentadas en la sección "Negocio Real" son la fuente de verdad para todas las decisiones técnicas.*
