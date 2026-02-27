# Essentia — E-commerce de Perfumería

E-commerce de perfumería de autor con diseño editorial minimalista. Next.js 14, Prisma, Zustand. Calidad "producción lite".

## Stack

- **Next.js 14+** (App Router) + TypeScript
- **Tailwind CSS** — diseño editorial sobrio
- **Prisma** — PostgreSQL (Neon en producción)
- **Zustand** — carrito y wishlist (guest, localStorage)
- **Zod** — validación
- **Wompi** — checkout hosted (Colombia, COP)

## Requisitos

- Node.js 18+
- npm

## Instalación

```bash
npm install
```

## Base de datos

```bash
# Generar cliente Prisma (postinstall lo hace automáticamente)
npm run db:generate

# Desarrollo: crear migraciones
npm run db:migrate

# Seed: 25 productos + 10 news items (solo desarrollo)
npm run db:seed
```

## Ejecutar

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Cómo probar

### Filtros y catálogo

1. Ir a `/catalogo`
2. Aplicar filtros: marca, familia, ocasión, intensidad, género, precio min/max
3. Verificar que la URL refleja los parámetros (`?marca=Chanel&familia=woody`, etc.)
4. Los chips de filtros activos aparecen; usar "Limpiar" para resetear
5. Ordenar por precio, nombre, etc.
6. "Cargar más" para paginación

### Checkout idempotente

1. Añadir productos al carrito
2. Ir a `/checkout` y rellenar el formulario
3. Hacer doble clic en "Confirmar pedido" o recargar durante el envío
4. Debe crearse una sola orden (idempotencia por `clientOrderId` en localStorage)
5. Verificar validación Zod: email inválido, teléfono corto, etc. muestran mensajes claros
6. Sin stock: intentar comprar más unidades de las disponibles → error "Sin stock suficiente"

### Novedades

1. Home: sección editorial con 1 destacado + 4 secundarios
2. `/novedades`: filtros por categoría (nicho/diseñador/árabe) y búsqueda por título
3. NewsCard: fecha, fuente, excerpt, enlace externo con `rel="noopener noreferrer"`

### Wishlist compartir

1. Añadir productos a la wishlist (corazón)
2. En `/wishlist`, clic en "Compartir wishlist"
3. Se genera un enlace y se copia al portapapeles
4. Abrir el enlace en otra pestaña/incógnito → ver wishlist compartida

### Pagos

**Desarrollo (mock):**
1. Crear pedido en `/checkout`
2. En `/orden/[code]`, clic en "Pagar online (Wompi)"
3. Redirige a `/pago/simulado` — elegir APPROVED o DECLINED
4. Tras APPROVED, la orden pasa a PAID; tras DECLINED, CANCELLED y se libera stock

**Producción (Wompi real):**
1. El botón redirige al Checkout Web de Wompi
2. El webhook recibe `transaction.updated` y actualiza la orden
3. El usuario vuelve a `/orden/[code]?payment=return`

## Despliegue en Vercel + Neon + Wompi

### Quick deploy (orden recomendado)

1. **GitHub** — Importa o conecta el repo en [Vercel](https://vercel.com)
2. **Neon** — Crea proyecto en [Neon](https://neon.tech), copia pooled + direct URLs
3. **Env vars** — Configura en Vercel: `DATABASE_URL`, `DATABASE_DIRECT_URL`, `WOMPI_*`, `NEXT_PUBLIC_BASE_URL`
4. **Deploy** — Vercel ejecuta `prisma migrate deploy && next build` automáticamente

**Importante:** `NEXT_PUBLIC_BASE_URL` debe ser la URL de producción de Vercel (ej. `https://essentia-store.vercel.app`) o tu dominio custom.

**Webhook Wompi:** `https://<tu-dominio>/api/webhooks/wompi` — configúralo en el Dashboard de Wompi (URL de eventos).

**Primera prueba sandbox:**
1. Crear pedido en checkout
2. Pagar con Wompi (sandbox)
3. Webhook recibe `transaction.updated` → orden pasa a PAID
4. Verificar en `/orden/[code]` que el estado es PAID

### 1. Neon (PostgreSQL)

1. Crear proyecto en [Neon](https://neon.tech)
2. Copiar **Connection string** (pooled) → `DATABASE_URL`
3. Copiar **Direct connection** → `DATABASE_DIRECT_URL`
4. En Prisma, ambos se usan: pooled para queries, direct para migraciones

### 2. Vercel

1. Conectar el repo en [Vercel](https://vercel.com)
2. Configurar variables de entorno (ver tabla abajo)
3. El build ejecuta `prisma migrate deploy` antes de `next build`
4. No configurar seed en producción (no se ejecuta automáticamente)

### 3. Wompi

1. Registrar en [comercios.wompi.co](https://comercios.wompi.co)
2. Obtener en Dashboard > Secrets:
   - **Integrity secret** → `WOMPI_INTEGRITY_SECRET`
   - **Events secret** → `WOMPI_EVENTS_SECRET`
3. Obtener **Public key** (sandbox: `pub_test_`, prod: `pub_prod_`) → `WOMPI_PUBLIC_KEY`
4. Configurar **URL de eventos** en el Dashboard:
   - `https://tu-dominio.vercel.app/api/webhooks/wompi`
   - Configurar una URL por ambiente (sandbox y producción)

### 4. Variables de entorno (producción)

| Variable | Requerido | Descripción |
|----------|-----------|-------------|
| `DATABASE_URL` | Sí | Neon pooled connection string |
| `DATABASE_DIRECT_URL` | Sí | Neon direct connection (migraciones) |
| `WOMPI_PUBLIC_KEY` | Sí | Clave pública (pub_test_ o pub_prod_) |
| `WOMPI_INTEGRITY_SECRET` | Sí | Secret para firma del checkout |
| `WOMPI_EVENTS_SECRET` | Sí | Secret para verificar webhooks |
| `WOMPI_ENV` | No | `sandbox` \| `production` |
| `NEXT_PUBLIC_BASE_URL` | Sí | URL pública (ej. `https://essentia.vercel.app`) |

### 5. Checklist producción

- [ ] `DATABASE_URL` y `DATABASE_DIRECT_URL` configurados
- [ ] `NEXT_PUBLIC_BASE_URL` apunta al dominio real (sin trailing slash)
- [ ] Wompi: URL de eventos configurada en el Dashboard
- [ ] Wompi: usar claves de producción (`pub_prod_`, `prod_integrity_`, `prod_events_`) en prod
- [ ] Verificar que el webhook responde 200 (Wompi reintenta si no)

## Variables de entorno (desarrollo)

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Postgres: `postgresql://...` |
| `DATABASE_DIRECT_URL` | Mismo que DATABASE_URL si no usas pooler |
| `WOMPI_*` | Opcional en dev (usa mock) |
| `MOCK_WEBHOOK_SECRET` | Firma para webhooks mock (`x-signature`) |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Migrar DB + build de producción |
| `npm run start` | Servidor de producción |
| `npm run migrate:deploy` | Aplicar migraciones (Vercel) |
| `npm run db:migrate` | Crear migración (desarrollo) |
| `npm run db:seed` | Seed de productos y news |
| `npm run db:studio` | Prisma Studio (explorar DB) |
| `npm run news:fetch` | Ingestor de news desde JSON local |
| `npm run test` | Tests (idempotencia payments/init, webhook APPROVED) |

## API

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/products` | GET | Productos con filtros y paginación (`marca`, `familia`, `ocasion`, `intensidad`, `genero`, `precioMin`, `precioMax`, `sort`, `page`, `limit`) |
| `/api/news` | GET | Novedades con filtros (`categoria`, `q`, `limit`) |
| `/api/checkout` | POST | Crear pedido (idempotente por `clientOrderId`, valida stock, transacción) |
| `/api/wishlist/share` | POST | Crear enlace compartible (`productIds`) |
| `/api/payments/init` | POST | Iniciar pago (`orderCode`, `provider`). Retorna `paymentUrl`. Idempotente. |
| `/api/payments/simulate` | POST | Simular resultado (dev). `orderCode`, `provider`, `providerTxnId`, `status` (APPROVED/DECLINED) |
| `/api/webhooks/wompi` | POST | Webhook Wompi. Payload real `transaction.updated` o mock con `x-signature` |
| `/api/webhooks/mercadopago` | POST | Webhook MercadoPago. Header `x-signature` = MOCK_WEBHOOK_SECRET |

## Estructura

```
src/
├── app/
│   ├── api/
│   │   ├── checkout/     # POST con Zod, clientOrderId, stock
│   │   ├── news/        # GET con filtros
│   │   ├── payments/    # init, simulate
│   │   ├── products/    # GET con filtros y paginación
│   │   ├── webhooks/    # wompi, mercadopago
│   │   └── wishlist/share/
│   ├── carrito/
│   ├── catalogo/        # Filtros URL, chips, load more
│   ├── checkout/
│   ├── novedades/       # Filtros categoría + búsqueda
│   ├── orden/[code]/
│   ├── p/[slug]/
│   └── wishlist/
│       └── compartido/[token]/
├── components/
│   ├── catalog/        # FiltersSidebar, FilterChips
│   └── ...
├── lib/
│   ├── catalog-params.ts
│   ├── checkout-schema.ts
│   └── ...
└── stores/
```

## Prisma: cambios recientes

- `Order`: status (CREATED \| PAYMENT_PENDING \| PAID \| CANCELLED \| REFUNDED), paymentProvider, paymentStatusRaw, paidAt
- `Order.clientOrderId` (String?, unique) — idempotencia checkout
- `PaymentAttempt` — orderId, provider, providerIntentId, providerTxnId, status, paymentUrl
- `StockReservation` — orderId, productId, qty, expiresAt (20 min)
- `WishlistShare` — token, productIds (JSON), createdAt

## Alcance (no implementado)

- Registro/login/auth/roles
- Rastreo de envíos
- Testers/decants/variantes por ml (cada producto = 1 unidad con stock)
