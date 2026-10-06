import { AppError } from '../utils/http.js';
export const validate = (schema, source = 'body') => (req, _res, next) => { const result = schema.safeParse(req[source]); if (!result.success) return next(new AppError(400, 'Request validation failed.', { issues: result.error.issues.map(({ path, message }) => ({ field: path.join('.'), message })) })); req[source] = result.data; next(); };
