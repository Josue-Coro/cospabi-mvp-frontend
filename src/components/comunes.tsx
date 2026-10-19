import type { ComponentProps, ReactNode } from "react"
import { PrinterIcon } from "lucide-react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

/** Título de cada pantalla con sus botones de acción a la derecha. */
export function Encabezado({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-primary">{titulo}</h1>
        {descripcion && <p className="text-sm text-muted-foreground">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 print:hidden">{children}</div>}
    </div>
  )
}

/** Etiqueta + control de formulario. El <label> envuelve al control para quedar asociados. */
export function Campo({
  etiqueta,
  ayuda,
  children,
  className,
}: {
  etiqueta: string
  ayuda?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm leading-none font-medium">{etiqueta}</span>
      {children}
      {ayuda && <span className="text-xs text-muted-foreground">{ayuda}</span>}
    </label>
  )
}

/** Lista desplegable nativa: funciona bien en celulares (lecturas en campo). */
export function Seleccion({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  )
}

const COLORES_ESTADO: Record<string, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800",
  PAGADO: "bg-emerald-100 text-emerald-800",
  PAGADA: "bg-emerald-100 text-emerald-800",
  APLICADO: "bg-emerald-100 text-emerald-800",
  VIGENTE: "bg-emerald-100 text-emerald-800",
  APROBADO: "bg-emerald-100 text-emerald-800",
  VENCIDO: "bg-red-100 text-red-800",
  ANULADO: "bg-zinc-200 text-zinc-700",
  ANULADA: "bg-zinc-200 text-zinc-700",
  ACTIVO: "bg-emerald-100 text-emerald-800",
  INACTIVO: "bg-zinc-200 text-zinc-700",
  BLOQUEADO: "bg-red-100 text-red-800",
  ABIERTA: "bg-sky-100 text-sky-800",
  CERRADA: "bg-zinc-200 text-zinc-700",
}

export function Estado({ valor }: { valor: string }) {
  return <Badge className={cn("uppercase", COLORES_ESTADO[valor] ?? "")}>{valor}</Badge>
}

/** Mensaje mientras carga, si hay error o si no hay filas. */
export function EstadoCarga({
  cargando,
  error,
  vacio,
  textoVacio = "No hay registros.",
}: {
  cargando: boolean
  error: string
  vacio?: boolean
  textoVacio?: string
}) {
  if (cargando) return <p className="py-6 text-center text-sm text-muted-foreground">Cargando...</p>
  if (error) return <p className="py-6 text-center text-sm text-destructive">{error}</p>
  if (vacio) return <p className="py-6 text-center text-sm text-muted-foreground">{textoVacio}</p>
  return null
}

export function BotonImprimir({ texto = "Imprimir" }: { texto?: string }) {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      <PrinterIcon /> {texto}
    </Button>
  )
}

/** Recuadro blanco que agrupa una tabla o un formulario. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-background p-4 print:border-0 print:p-0", className)}>
      {children}
    </div>
  )
}
