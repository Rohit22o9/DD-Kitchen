const { badRequest } = require('../utils/httpError');

/**
 * Validate req[part] against a zod schema and replace it with the parsed
 * (coerced, stripped) value. Unknown fields are dropped, which also blocks
 * mass-assignment of fields like role, status or payment_status.
 */
const validate =
  (schema, part = 'body') =>
  (req, res, next) => {
    const result = schema.safeParse(req[part] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
      const first = details[0];
      return next(badRequest(first ? `${first.field ? `${first.field}: ` : ''}${first.message}` : 'Invalid request.', details));
    }
    if (part === 'query') {
      req.validatedQuery = result.data;
    } else {
      req[part] = result.data;
    }
    return next();
  };

module.exports = validate;
