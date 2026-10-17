# cospabi-mvp-frontend

Panel administrativo del MVP de la Cooperativa de Agua Potable **COSPABI R.L.**
(React + TypeScript + Vite + Tailwind CSS + shadcn/ui). Consume la API `cospabi-mvp-backend`.

Desplegado en https://cospabi-mvp-frontend.vercel.app

## Pantallas

El menú muestra a cada rol solo lo que puede usar (la API también lo valida).

- **Administración:** usuarios y roles, caja con arqueo, bitácora.
- **Configuración:** tarifas, tipos de cargo, medidores, periodos.
- **Atención al Cliente:** personas, socios (ficha con crédito de inscripción y cuenta del portal),
  cobro de avisos con factura opcional.
- **Operaciones:** lecturas por ruta (pensada para el celular del plomero), rutas, avisos
  (con generación por periodo y aviso imprimible), cargos extra.
- **Facturación:** facturas emitidas, imprimibles con QR (simuladas, sin validez fiscal).
- **Reportes:** caja, morosidad, pagos del portal, pagos de inscripción (imprimibles).

La sesión se cierra sola tras 15 minutos sin actividad (RNF-04).

## Ejecutar en local

```bash
npm install
cp .env.example .env      # ajustar VITE_API_URL si la API no está en localhost:8000
npm run dev
```

## Despliegue en Vercel

- Framework: Vite (build `npm run build`, salida `dist`).
- Variable de entorno: `VITE_API_URL` = URL de la API en Render.
- `vercel.json` redirige todas las rutas a `index.html` (React Router).
