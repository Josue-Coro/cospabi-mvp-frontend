// Cliente HTTP para la API de COSPABI (FastAPI en Render)
const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "")

const CLAVE_TOKEN = "cospabi_token"

export function obtenerToken(): string | null {
  return localStorage.getItem(CLAVE_TOKEN)
}

export function guardarToken(token: string | null) {
  if (token) localStorage.setItem(CLAVE_TOKEN, token)
  else localStorage.removeItem(CLAVE_TOKEN)
}

export class ErrorApi extends Error {
  status: number

  constructor(status: number, mensaje: string) {
    super(mensaje)
    this.status = status
  }
}

/** Llama a un endpoint de /api/v1 y devuelve el JSON. Envía el token si existe. */
export async function api<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = obtenerToken()
  const respuesta = await fetch(`${API_URL}/api/v1${ruta}`, {
    ...opciones,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  })

  const datos = await respuesta.json().catch(() => null)
  if (respuesta.status === 401 && token) {
    // El token venció: se avisa a la sesión para volver al login
    guardarToken(null)
    window.dispatchEvent(new Event("sesion-expirada"))
  }
  if (!respuesta.ok) {
    // FastAPI devuelve el error en "detail" (texto o lista de validaciones)
    const detalle = datos?.detail
    const mensaje = Array.isArray(detalle)
      ? detalle.map((d: { msg: string }) => d.msg).join(", ")
      : detalle ?? `Error ${respuesta.status}`
    throw new ErrorApi(respuesta.status, mensaje)
  }
  return datos as T
}
