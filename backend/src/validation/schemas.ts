import type { Response } from "express";
import { z } from "zod";

export const noteSchema = z.object({
  content: z.string().default(""),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .default("#D9A441"),
  x: z
    .number()
    .int()
    .min(0)
    .default(Math.round(Math.random() * 650)),
  y: z
    .number()
    .int()
    .min(0)
    .default(Math.round(Math.random() * 240)),
  rotation: z
    .number()
    .int()
    .min(-3)
    .max(3)
    .default(Math.round(Math.random() * 6 - 3)),
});

export const createSpaceSchema = z.object({
  name: z.string().min(1).trim(),
  color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i)
    .default("#3E7C6B"),
  icon: z.string().default("folder"),
});

export const updateSpaceSchema = z
  .object({
    name: z.string().min(1).trim().optional(),
    color: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i)
      .optional(),
    icon: z.string().optional(),
    position: z.number().int().optional(),
    noteLayout: z.enum(["grid", "list"]).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Atleast one field must be provided",
  });

export const createTodoSchema = z.object({
  title: z.string().min(1).trim(),
});

export const updateTodoSchema = z.object({
  title: z.string().min(1).trim().optional(),
  done: z.boolean().optional(),
  priority: z.boolean().optional(),
  position: z.number().int().optional(),
});

const formatZodError = (e: z.ZodError) => {
  return e.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
};

export const returnValidationError = (res: Response, e: z.ZodError) => {
  return res.status(400).json({ errors: formatZodError(e) });
};
