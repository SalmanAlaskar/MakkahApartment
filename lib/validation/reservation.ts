import { z } from "zod";

export const reservationFormSchema = z
  .object({
    guestName: z.string().min(1, "required"),
    platform: z.enum(["direct", "airbnb", "booking", "other"]),
    rentalType: z.enum(["daily", "monthly"]),
    checkIn: z.string().min(1, "required"),
    checkOut: z.string().min(1, "required"),
    grossAmount: z.coerce.number().nonnegative(),
    paidAmount: z.coerce.number().nonnegative(),
    paymentMethod: z.string().optional(),
    feeMethod: z.enum(["flat_amount", "percent_of_gross"]),
    feeAmount: z.coerce.number().nonnegative().optional(),
    feePercent: z.coerce.number().min(0).max(100).optional(),
    expenseAmount: z.coerce.number().nonnegative().default(0),
    expenseNote: z.string().optional(),
    status: z.enum(["confirmed", "cancelled", "completed"]),
    notes: z.string().optional(),
  })
  .refine((data) => new Date(data.checkOut) > new Date(data.checkIn), {
    message: "check-out must be after check-in",
    path: ["checkOut"],
  })
  .refine(
    (data) =>
      data.feeMethod === "flat_amount" ? data.feeAmount !== undefined : data.feePercent !== undefined,
    { message: "fee amount or percent is required for the chosen fee method", path: ["feeAmount"] },
  );

export type ReservationFormInput = z.infer<typeof reservationFormSchema>;
