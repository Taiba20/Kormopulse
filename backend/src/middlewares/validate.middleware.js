import { ApiError } from "../utils/ApiError.js";

/**
 * Validates req[source] with a zod schema. On success the parsed (and trimmed /
 * coerced) value replaces req.body, or is exposed as req.validated for
 * query/params, because Express 5 makes req.query read-only.
 */
export const validate =
  (schema, source = "body") =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      const first = errors[0];
      return next(
        new ApiError(400, first?.field ? `${first.field}: ${first.message}` : first?.message || "Invalid request", errors)
      );
    }
    if (source === "body") req.body = result.data;
    else req.validated = { ...(req.validated || {}), [source]: result.data };
    next();
  };
