# Fase 0 — Descubrimiento y aterrizaje funcional

## Objetivo
Convertir las necesidades descritas en el excel de cotizaciones en un dominio claro para el desarrollo del software.

## Decisiones y Definiciones

### Mapa de Campos
- **Vendedor (`SellerProfile`)**: id, nombre, profesión, dirección, celular, email, identificación, activo.
- **Cliente (`Customer`)**: id, nombres, apellidos, dirección, celular, email, identificación, notas.
- **Documento (`CommercialDocument`)**: 
  - Variante: Cotización o Factura
  - Atributos compartidos: número, fecha, seller, customer, items, observaciones, totales (subtotal, tax, envio, amazon, 4x1000, totalFinal).
- **Item (`CommercialDocumentItem`)**: descripción, cantidad, precio base unitario, flag tax, tax valor, envio unitario, flag amazon, amazon valor, costo unitario final, subtotal linea, flag 4x1000, 4x1000 linea, total linea.

### Reglas de cálculo documentadas
- `costo_unitario_final` = precio base + envio + tax (si aplica) + amazon (si aplica).
- `subtotal_linea` = cantidad * costo unitario final.
- `4x1000` = configurado global o por linea (se recomienda global).

### Definición de Tipos de PDF
El sistema soportará múltiples "Strategies" de renderizado PDF:
1. **PDF completo**: Todos los campos, ideal para detalle técnico y comercial.
2. **PDF resumido**: Características principales y totales, para lecturas rápidas.
3. **PDF concatenado**: Lista continua item por item, imitando la plantilla actual en Excel.

### Estructura de Base de Datos
- PostgreSQL usando Prisma ORM
- Esquema definido para: SellerProfiles, Customers, CommercialDocuments, CommercialDocumentItems, AppSettings.

### Arquitectura Cerrada
- **Monolito Modular** por capas (Presentación, Aplicación, Dominio, Infraestructura).
- Frontend: Next.js + TailwindCSS + shadcn/ui.
- Backend/API: NestJS o integrarlo todo con Next.js App Router y Server Actions para reducir complejidad.
  - Para este proyecto y dado el alcance (sin microservicios), la vía más pragmática y unificada será **Next.js Fullstack (App Router)** usando Server Actions como capa de aplicación y Prisma como infraestructura/DB.

---
### Estado
**Fase 0**: COMPLETADA.
