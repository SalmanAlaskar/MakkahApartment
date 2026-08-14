import { z } from "zod";

export const monthlyExpenseFormSchema = z.object({
  month: z.string().min(1, "required"), // "YYYY-MM" from an <input type="month">
  internetBill: z.coerce.number().nonnegative().default(0),
  electricityBill: z.coerce.number().nonnegative().default(0),
  otherExpense: z.coerce.number().nonnegative().default(0),
  otherExpenseNote: z.string().optional(),
});

export type MonthlyExpenseFormInput = z.infer<typeof monthlyExpenseFormSchema>;
