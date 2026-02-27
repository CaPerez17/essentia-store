import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Producto requerido"),
  quantity: z.number().int().positive("Cantidad debe ser al menos 1"),
  price: z.number().positive("Precio inválido"),
});

export const checkoutSchema = z
  .object({
    clientOrderId: z.string().uuid("ID de pedido inválido").optional(),
    email: z
      .string()
      .min(1, "Email requerido")
      .email("Introduce un email válido"),
    phone: z
      .string()
      .optional()
      .refine((v) => !v || v.replace(/\D/g, "").length >= 9, "Teléfono debe tener al menos 9 dígitos"),
    shippingName: z
      .string()
      .min(2, "Nombre debe tener al menos 2 caracteres")
      .max(100, "Nombre demasiado largo"),
    shippingAddr: z
      .string()
      .min(5, "Dirección debe tener al menos 5 caracteres")
      .max(200, "Dirección demasiado larga"),
    shippingCity: z
      .string()
      .min(2, "Ciudad requerida")
      .max(80, "Ciudad demasiado larga"),
    shippingZip: z.string().max(20).optional(),
    shippingNotes: z.string().max(500).optional(),
    items: z
      .array(checkoutItemSchema)
      .min(1, "El carrito está vacío"),
    subtotal: z.number().min(0, "Subtotal inválido"),
    shippingCost: z.number().min(0, "Coste de envío inválido"),
    total: z.number().min(0, "Total inválido"),
  })
  .refine((d) => Math.abs(d.subtotal + d.shippingCost - d.total) < 0.01, {
    message: "El total no coincide con subtotal + envío",
    path: ["total"],
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
