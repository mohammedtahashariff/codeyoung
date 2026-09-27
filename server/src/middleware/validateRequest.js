import { ZodError } from "zod";

/**
 * Middleware factory for validating request body, query, or params with Zod schemas
 * @param {import('zod').ZodSchema} schema
 * @param {'body'|'query'|'params'} [source='body']
 */
export const validateRequest = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req[source]);
      req[source] = validated;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const formattedErrors = err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: formattedErrors,
        });
      }
      next(err);
    }
  };
};
