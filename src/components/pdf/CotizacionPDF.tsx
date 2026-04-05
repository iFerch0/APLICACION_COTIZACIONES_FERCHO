import { Document, Page, Text, View, StyleSheet, Svg, Polygon, Rect } from '@react-pdf/renderer';
import { ItemCalculated, DocumentTotals } from '@/lib/calculator';
import type { SellerData } from '@/app/actions/seller';

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 90,
    paddingHorizontal: 45,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1A202C',
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  logoColumn: {
    flex: 1.2,
  },
  logoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0B2046',
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  logoSubtitle: {
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#4A5568',
  },
  companyInfoColumn: {
    flex: 1.2,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#0066FF',
    justifyContent: 'center',
    height: 35,
  },
  companyInfoText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1A202C',
    lineHeight: 1.4,
  },
  companyAddressText: {
    fontSize: 9,
    color: '#4A5568',
    marginTop: 2,
  },
  documentMetaColumn: {
    flex: 1.4,
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0B2046',
    marginBottom: 4,
  },
  docNit: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  metaGrid: {
    alignItems: 'flex-end',
    gap: 3,
  },
  metaText: {
    fontSize: 9,
    color: '#1A202C',
  },
  metaLabel: {
    fontWeight: 'bold',
  },
  clientSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0B2046',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0B2046',
    paddingBottom: 4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  clientInfoWrapper: {
    flexDirection: 'row',
  },
  clientCol: {
    flex: 1,
    gap: 4,
  },
  clientTextRow: {
    fontSize: 10,
    color: '#1A202C',
  },
  tableWrapper: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0B2046',
    paddingVertical: 8,
    alignItems: 'center',
  },
  tableHeaderText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 8,
    alignItems: 'center',
  },
  tableRowText: {
    fontSize: 9,
    color: '#1A202C',
  },
  colCant: {
    width: '12%',
    textAlign: 'center',
  },
  colDescNum: {
    width: '52%',
    paddingHorizontal: 8,
  },
  colUnit: {
    width: '18%',
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  colSubtotal: {
    width: '18%',
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  // Table columns for completo
  colDescComp: {
    width: '36%',
    paddingHorizontal: 8,
  },
  colTaxesComp: {
    width: '16%',
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  totalsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 15,
  },
  totalsBox: {
    width: '45%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalRowText: {
    fontSize: 9,
    color: '#4A5568',
  },
  totalRowValue: {
    fontSize: 9,
    color: '#1A202C',
    textAlign: 'right',
  },
  totalFinalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 6,
    marginTop: 4,
  },
  totalFinalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0B2046',
  },
  totalFinalValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0B2046',
  },
  notesBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#0066FF',
  },
  notesTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#0B2046',
  },
  notesText: {
    fontSize: 9,
    color: '#4A5568',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 45,
    right: 45,
  },
  footerTerms: {
    fontSize: 8,
    color: '#1A202C',
    marginBottom: 2,
  },
  footerDivider: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginVertical: 6,
  },
  footerThanks: {
    fontSize: 8,
    color: '#4A5568',
    textAlign: 'center',
  },
  concatenatedRow: {
    flexDirection: 'row',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
});

const BackgroundDecor = () => (
  <View fixed style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
    <Svg width="100%" height="100%">
      {/* Left border thick gray strip */}
      <Rect x="0" y="0" width="18" height="100%" fill="#E2E8F0" />
      {/* Left blue accent angular polygon */}
      <Polygon points="0,150 18,150 18,300 0,330" fill="#0066FF" />
      {/* Top right blue decorative triangle */}
      <Polygon points="512,0 612,0 612,70" fill="#0066FF" />
      {/* Top right dark corner beneath */}
      <Polygon points="542,0 612,0 612,50" fill="#0B2046" opacity="0.8" />
      {/* Bottom right blue polygon accent */}
      <Polygon points="562,792 612,792 612,700" fill="#0066FF" />
    </Svg>
  </View>
);

interface PdfProps {
  formato: 'completo' | 'resumido' | 'concatenado';
  cliente: {
    nombres: string;
    email: string;
    notas: string;
  };
  items: ItemCalculated[];
  totales: DocumentTotals;
  tipoDocumento: 'COTIZACION' | 'FACTURA';
  seller?: SellerData | null;
  numero?: string;
}

const fmt = (val: number | { toString(): string }) => `$${Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

export const CotizacionPDF = ({
  formato,
  cliente,
  items,
  totales,
  tipoDocumento,
  seller,
  numero,
}: PdfProps) => {
  const isCotizacion = tipoDocumento === 'COTIZACION';
  const docTitle = isCotizacion ? 'COTIZACIÓN COMERCIAL' : 'FACTURA COMERCIAL';

  const docNumber = numero ?? (isCotizacion ? 'BORRADOR' : 'BORRADOR');
  const emissionDate = new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
  const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <BackgroundDecor />

        {/* --- HEADER --- */}
        <View style={styles.headerRow}>
          <View style={styles.logoColumn}>
            <Text style={styles.logoTitle}>
              {seller?.nombre || 'GLOBAL TECH COMPONENTS'}
            </Text>
            <Text style={styles.logoSubtitle}>
              {seller?.profesion || 'Computer Parts and Custom Gaming PC Builds'}
            </Text>
          </View>

          <View style={styles.companyInfoColumn}>
            <Text style={styles.companyAddressText}>
              {seller?.direccion || 'Montería, Cordoba, Colombia'}
            </Text>
          </View>

          <View style={styles.documentMetaColumn}>
            <Text style={styles.docTitle}>{docTitle}</Text>
            <Text style={styles.docNit}>NIT: {seller?.identificacion || '901234567-8'}</Text>

            <View style={styles.metaGrid}>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>{isCotizacion ? 'COTIZACIÓN No: ' : 'FACTURA No: '}</Text>
                {docNumber}
              </Text>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>FECHA DE EMISIÓN: </Text>
                {emissionDate}
              </Text>
              <Text style={styles.metaText}>
                <Text style={styles.metaLabel}>FECHA VENCIMIENTO: </Text>
                {dueDate}
              </Text>
            </View>
          </View>
        </View>

        {/* --- DATOS DEL CLIENTE --- */}
        <View style={styles.clientSection}>
          <Text style={styles.sectionTitle}>Datos del Cliente</Text>
          <View style={styles.clientInfoWrapper}>
            <View style={styles.clientCol}>
              <Text style={styles.clientTextRow}>
                <Text style={{ fontWeight: 'bold' }}>Cliente: </Text>
                {cliente.nombres || '_______________________'}
              </Text>
              <Text style={styles.clientTextRow}>
                <Text style={{ fontWeight: 'bold' }}>Email: </Text>
                {cliente.email || '_______________________'}
              </Text>
            </View>
          </View>
        </View>

        {/* --- DETALLE DE PRODUCTOS Y SERVICIOS --- */}
        <View style={styles.tableWrapper}>
          <Text style={styles.sectionTitle}>Detalle de Productos y Servicios</Text>

          {formato === 'completo' && (
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colCant]}>CANTIDAD</Text>
                <Text style={[styles.tableHeaderText, styles.colDescComp]}>DESCRIPCIÓN DE ARTÍCULO / SERVICIO</Text>
                <Text style={[styles.tableHeaderText, styles.colUnit]}>P. UNIT BASE</Text>
                <Text style={[styles.tableHeaderText, styles.colTaxesComp]}>IMPUESTOS/ENVÍO</Text>
                <Text style={[styles.tableHeaderText, styles.colSubtotal]}>SUBTOTAL</Text>
              </View>
              {items.map((item, i) => (
                <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 !== 0 ? '#F8FAFC' : '#FFFFFF' }]}>
                  <Text style={[styles.tableRowText, styles.colCant]}>{item.cantidad}x</Text>
                  <Text style={[styles.tableRowText, styles.colDescComp]}>{item.descripcion}</Text>
                  <Text style={[styles.tableRowText, styles.colUnit]}>{fmt(item.precioUnitarioBase)}</Text>
                  <View style={styles.colTaxesComp}>
                    {item.aplicaTax && <Text style={{ fontSize: 7, color: '#4A5568' }}>Tax: {fmt(item.taxUnitario)}</Text>}
                    {(Number(item.envioUnitario) > 0 || Number(item.promocionEnvioUnitario) > 0) && (
                      <Text style={{ fontSize: 7, color: '#4A5568' }}>Envio: {fmt(Number(item.envioUnitario) - Number(item.promocionEnvioUnitario))}</Text>
                    )}
                    {Number(item.importacionUnitario) > 0 && <Text style={{ fontSize: 7, color: '#4A5568' }}>Imp: {fmt(item.importacionUnitario)}</Text>}
                    {item.aplicaAmazon && <Text style={{ fontSize: 7, color: '#4A5568' }}>Garantía: +2.25%</Text>}
                    {!item.aplicaTax && Number(item.envioUnitario) <= 0 && Number(item.importacionUnitario) <= 0 && !item.aplicaAmazon && (
                      <Text style={{ fontSize: 7, color: '#A0AEC0' }}>N/A</Text>
                    )}
                  </View>
                  <Text style={[styles.tableRowText, styles.colSubtotal]}>{fmt(item.subtotalLinea)}</Text>
                </View>
              ))}
            </View>
          )}

          {formato === 'resumido' && (
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colCant]}>CANTIDAD</Text>
                <Text style={[styles.tableHeaderText, styles.colDescNum]}>DESCRIPCIÓN DE ARTÍCULO / SERVICIO</Text>
                <Text style={[styles.tableHeaderText, styles.colUnit]}>P. UNITARIO (COP)</Text>
                <Text style={[styles.tableHeaderText, styles.colSubtotal]}>SUBTOTAL (COP)</Text>
              </View>
              {items.map((item, i) => (
                <View key={i} style={[styles.tableRow, { backgroundColor: i % 2 !== 0 ? '#F8FAFC' : '#FFFFFF' }]}>
                  <Text style={[styles.tableRowText, styles.colCant]}>{item.cantidad}x</Text>
                  <Text style={[styles.tableRowText, styles.colDescNum]}>{item.descripcion}</Text>
                  <Text style={[styles.tableRowText, styles.colUnit]}>{fmt(item.costoUnitarioFinal)}</Text>
                  <Text style={[styles.tableRowText, styles.colSubtotal]}>{fmt(item.subtotalLinea)}</Text>
                </View>
              ))}
            </View>
          )}

          {formato === 'concatenado' && (
            <View style={{ marginTop: 10 }}>
              {items.map((item, i) => (
                <View key={i} style={styles.concatenatedRow}>
                  <Text style={{ fontSize: 10, color: '#1A202C' }}>
                    <Text style={{ fontWeight: 'bold' }}>{item.cantidad}x </Text>
                    {item.descripcion}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* --- TOTALES --- */}
        <View style={styles.totalsContainer}>
          <View style={styles.totalsBox}>
            {formato === 'completo' && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalRowText}>Subtotal Ítems:</Text>
                  <Text style={styles.totalRowValue}>{fmt(totales.subtotal)}</Text>
                </View>
                {Number(totales.totalTax) > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowText}>Total Tax:</Text>
                    <Text style={styles.totalRowValue}>{fmt(totales.totalTax)}</Text>
                  </View>
                )}
                {Number(totales.totalEnvio) > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowText}>Costo Envío:</Text>
                    <Text style={styles.totalRowValue}>{fmt(totales.totalEnvio)}</Text>
                  </View>
                )}
                {Number(totales.totalPromocionEnvio) > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowText}>Promo Envío Gratis:</Text>
                    <Text style={[styles.totalRowValue, { color: '#E53E3E' }]}>-{fmt(totales.totalPromocionEnvio)}</Text>
                  </View>
                )}
                {Number(totales.totalImportacion) > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowText}>Total Importación:</Text>
                    <Text style={styles.totalRowValue}>{fmt(totales.totalImportacion)}</Text>
                  </View>
                )}
                {Number(totales.totalAmazon) > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowText}>Garantía/Tasa C.:</Text>
                    <Text style={styles.totalRowValue}>{fmt(totales.totalAmazon)}</Text>
                  </View>
                )}
              </>
            )}

            {/* Si es resumido o concatenado, solo muestra subtotal general en crudo si quisiera, o directamente el total */}
            {formato !== 'completo' && (
              <View style={styles.totalRow}>
                <Text style={styles.totalRowText}>SUBTOTAL BRUTO:</Text>
                <Text style={styles.totalRowValue}>{fmt(totales.subtotal)}</Text>
              </View>
            )}

            <View style={styles.totalFinalBox}>
              <Text style={styles.totalFinalLabel}>TOTAL A PAGAR</Text>
              <Text style={styles.totalFinalValue}>{fmt(totales.totalFinal)} (COP)</Text>
            </View>
          </View>
        </View>

        {/* --- NOTAS --- */}
        {cliente.notas && (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Notas y Observaciones:</Text>
            <Text style={styles.notesText}>{cliente.notas}</Text>
          </View>
        )}

        {/* --- FOOTER --- */}
        <View fixed style={styles.footer}>
          <Text style={{ fontWeight: 'bold', fontSize: 9, marginBottom: 4 }}>Términos y Condiciones:</Text>
          <Text style={styles.footerTerms}>Garantía estándar según fabricante. La validez de este documento es de 15 días calendario.</Text>
          <View style={styles.footerDivider} />
          <Text style={styles.footerThanks}>
            Gracias por confiar en <Text style={{ fontWeight: 'bold' }}>{seller?.nombre || 'GLOBAL TECH COMPONENTS'}</Text> {seller?.celular && ` | Tel: ${seller?.celular}`} {seller?.email && ` | ${seller?.email}`}
          </Text>
        </View>

      </Page>
    </Document>
  );
};

