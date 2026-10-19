// Formatos de Bolivia para montos y fechas

export function bs(monto: number | null | undefined): string {
  if (monto === null || monto === undefined) return "—"
  return `Bs ${monto.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** '2026-10-17' -> '17/10/2026' (sin pasar por Date, para no correr el día por la zona horaria) */
export function fecha(valor: string | null | undefined): string {
  if (!valor) return "—"
  const [anio, mes, dia] = valor.slice(0, 10).split("-")
  return `${dia}/${mes}/${anio}`
}

/** '2026-10-17T14:57:08' -> '17/10/2026 14:57' */
export function fechaHora(valor: string | null | undefined): string {
  if (!valor) return "—"
  return `${fecha(valor)} ${valor.slice(11, 16)}`
}

/** Hora ('14:57') hasta la que sigue bloqueada una cuenta por intentos fallidos, o null si ya no lo está */
export function horaDesbloqueo(valor: string | null | undefined): string | null {
  if (!valor || new Date(valor) <= new Date()) return null
  return valor.slice(11, 16)
}

/** Fecha de hoy en formato yyyy-mm-dd para los campos de fecha */
export function hoyISO(): string {
  const ahora = new Date()
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export function primerDiaMesISO(): string {
  return `${hoyISO().slice(0, 8)}01`
}

/** Ordena periodos 'MM/yyyy' del más reciente al más antiguo */
export function ordenarPeriodos<T extends { periodo: string }>(periodos: T[]): T[] {
  const clave = (p: T) => {
    const [mes, anio] = p.periodo.split("/")
    return Number(anio) * 100 + Number(mes)
  }
  return [...periodos].sort((a, b) => clave(b) - clave(a))
}

/** Periodo del mes actual o, si no existe, el último que ya pasó (no uno futuro de las cuotas). */
export function periodoActual<T extends { periodo: string }>(periodos: T[]): T | undefined {
  const [anio, mes] = hoyISO().split("-")
  const claveHoy = Number(anio) * 100 + Number(mes)
  return ordenarPeriodos(periodos).find((p) => {
    const [m, a] = p.periodo.split("/")
    return Number(a) * 100 + Number(m) <= claveHoy
  })
}
