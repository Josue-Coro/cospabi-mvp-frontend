import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSesion } from "@/lib/auth"

// Los 6 modulos del sistema (las pantallas se agregan en los siguientes pasos)
const MODULOS = [
  { nombre: "Administración", detalle: "Usuarios, roles, caja y bitácora" },
  { nombre: "Configuración", detalle: "Tarifas, tipos de cargo, medidores y periodos" },
  { nombre: "Atención al Cliente", detalle: "Personas, socios, crédito de inscripción y pagos" },
  { nombre: "Operaciones", detalle: "Rutas, lecturas, avisos y cargos extra" },
  { nombre: "Facturación", detalle: "Facturas emitidas al cobrar" },
  { nombre: "Reportes", detalle: "Caja, morosidad, pagos del portal e inscripción" },
]

export default function Inicio() {
  const { usuario } = useSesion()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Bienvenido, {usuario?.nombre}</h1>
        <p className="text-muted-foreground">Rol: {usuario?.rol}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODULOS.map((modulo) => (
          <Card key={modulo.nombre}>
            <CardHeader>
              <CardTitle>{modulo.nombre}</CardTitle>
              <CardDescription>{modulo.detalle}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
