import { Link, useParams } from "react-router-dom"

import { BotonImprimir, Encabezado, EstadoCarga } from "@/components/comunes"
import VistaFactura from "@/components/VistaFactura"
import { buttonVariants } from "@/components/ui/button"
import { useDatos } from "@/lib/datos"
import type { FacturaDetalle as TipoFactura } from "@/lib/tipos"

export default function FacturaDetalle() {
  const { id } = useParams()
  const factura = useDatos<TipoFactura>(`/facturas/${id}`)
  const f = factura.datos

  if (!f) return <EstadoCarga cargando={factura.cargando} error={factura.error} />

  return (
    <>
      <Encabezado titulo={`Factura N° ${f.numero_factura}`} descripcion={`${f.nit_ci} · ${f.razon_social}`}>
        <BotonImprimir />
        {f.id_aviso && (
          <Link to={`/avisos/${f.id_aviso}`} className={buttonVariants({ variant: "outline" })}>Ver aviso</Link>
        )}
      </Encabezado>
      <VistaFactura f={f} />
    </>
  )
}
