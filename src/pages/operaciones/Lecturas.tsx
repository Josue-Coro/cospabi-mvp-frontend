import { useState } from "react"
import { CheckCircle2Icon } from "lucide-react"

import { Campo, Encabezado, EstadoCarga, Panel, Seleccion } from "@/components/comunes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { enviar, useDatos } from "@/lib/datos"
import { ordenarPeriodos, periodoActual } from "@/lib/formato"
import type { FilaPlanilla, Lectura, Periodo, Planilla, Ruta } from "@/lib/tipos"

/** HU14: el plomero recorre su ruta y registra cada lectura desde el celular. */
export default function Lecturas() {
  const rutas = useDatos<Ruta[]>("/rutas")
  const periodos = useDatos<Periodo[]>("/periodos")
  const [rutaElegida, setIdRuta] = useState("")
  const [periodoElegido, setIdPeriodo] = useState("")

  // Por defecto: la primera ruta y el periodo del mes actual
  const idRuta = rutaElegida || (rutas.datos?.length ? String(rutas.datos[0].id_ruta) : "")
  const actual = periodos.datos ? periodoActual(periodos.datos) : undefined
  const idPeriodo = periodoElegido || (actual ? String(actual.id_periodo) : "")

  const planilla = useDatos<Planilla>(
    idRuta && idPeriodo ? `/rutas/${idRuta}/planilla?id_periodo=${idPeriodo}` : null,
  )
  const filas = planilla.datos?.medidores ?? []
  const leidos = filas.filter((f) => f.leido).length

  return (
    <>
      <Encabezado
        titulo="Lecturas por ruta"
        descripcion="Medidores en orden de recorrido. El consumo se calcula solo: lectura actual − anterior."
      />
      <Panel className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Campo etiqueta="Ruta">
            <Seleccion className="h-11" value={idRuta} onChange={(e) => setIdRuta(e.target.value)}>
              {rutas.datos?.map((r) => <option key={r.id_ruta} value={r.id_ruta}>Ruta {r.ruta} - {r.descripcion}</option>)}
            </Seleccion>
          </Campo>
          <Campo etiqueta="Periodo">
            <Seleccion className="h-11" value={idPeriodo} onChange={(e) => setIdPeriodo(e.target.value)}>
              {periodos.datos && ordenarPeriodos(periodos.datos).map((p) => (
                <option key={p.id_periodo} value={p.id_periodo}>{p.periodo}</option>
              ))}
            </Seleccion>
          </Campo>
          <div className="flex items-end text-sm text-muted-foreground">
            {planilla.datos && `${leidos} de ${filas.length} medidores leídos`}
          </div>
        </div>
      </Panel>

      <div className="grid gap-3">
        {filas.map((fila) => (
          <FilaLectura key={fila.id_medidor} fila={fila} idPeriodo={Number(idPeriodo)} alGuardar={planilla.recargar} />
        ))}
      </div>
      <EstadoCarga cargando={planilla.cargando} error={planilla.error} vacio={planilla.datos !== null && filas.length === 0}
        textoVacio="La ruta no tiene medidores asignados a socios activos." />
    </>
  )
}

function FilaLectura({ fila, idPeriodo, alGuardar }: { fila: FilaPlanilla; idPeriodo: number; alGuardar: () => void }) {
  const [actual, setActual] = useState("")
  const [inicial, setInicial] = useState("")
  const [observacion, setObservacion] = useState("")
  const [guardando, setGuardando] = useState(false)

  const anterior = fila.lectura_anterior ?? (inicial === "" ? 0 : Number(inicial))
  const consumo = actual === "" ? null : Number(actual) - anterior

  async function guardar() {
    setGuardando(true)
    const lectura = await enviar<Lectura>("/lecturas", {
      medidor_id_medidor: fila.id_medidor,
      periodo_id_periodo: idPeriodo,
      lectura_actual: Number(actual),
      observacion: observacion || null,
      lectura_inicial: fila.lectura_anterior === null && inicial !== "" ? Number(inicial) : null,
    }, `Lectura de ${fila.codigo_fijo} guardada`)
    setGuardando(false)
    if (lectura) alGuardar()
  }

  return (
    <Panel className={fila.leido ? "bg-emerald-50/60 dark:bg-emerald-950/40" : ""}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{fila.codigo_fijo} · {fila.nombre_socio}</p>
          <p className="text-xs text-muted-foreground">
            Medidor {fila.serie_medidor} · casa {fila.num_casa ?? "—"} · anterior {fila.lectura_anterior ?? "sin lecturas"}
          </p>
        </div>
        {fila.leido && (
          <p className="flex items-center gap-1 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2Icon className="size-4" /> {fila.lectura_actual} m³ · consumo {fila.consumo_m3} m³
          </p>
        )}
      </div>
      {!fila.leido && (
        <div className="mt-3 grid gap-2 sm:grid-cols-[repeat(3,1fr)_auto] sm:items-end">
          {fila.lectura_anterior === null && (
            <Campo etiqueta="Lectura inicial">
              <Input className="h-11" type="number" inputMode="numeric" min="0" value={inicial} onChange={(e) => setInicial(e.target.value)} placeholder="0" />
            </Campo>
          )}
          <Campo etiqueta="Lectura actual (m³)" ayuda={consumo !== null ? `Consumo: ${consumo} m³` : undefined}>
            <Input className="h-11" type="number" inputMode="numeric" min={anterior} value={actual} onChange={(e) => setActual(e.target.value)} />
          </Campo>
          <Campo etiqueta="Observación" ayuda="Obligatoria si el consumo es anormal">
            <Input className="h-11" value={observacion} onChange={(e) => setObservacion(e.target.value)} placeholder="Casa cerrada, fuga..." />
          </Campo>
          <Button className="h-11" onClick={guardar} disabled={actual === "" || guardando || (consumo !== null && consumo < 0)}>
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      )}
    </Panel>
  )
}
