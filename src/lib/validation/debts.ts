import { z } from "zod";

export const debtTypeSchema = z.enum(["I_OWE", "OWED_TO_ME"]);
export const debtStatusSchema = z.enum(["OPEN", "PARTIALLY_SETTLED", "SETTLED"]);
export const splitMethodSchema = z.enum(["EQUAL", "CUSTOM"]);

export const contactNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(60);

export const debtReasonSchema = z
  .string()
  .trim()
  .max(120);

export const splitTitleSchema = z
  .string()
  .trim()
  .min(1)
  .max(80);
