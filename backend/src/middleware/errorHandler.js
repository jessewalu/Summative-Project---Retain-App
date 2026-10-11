// Last stop for every error. Anything thrown in a route ends up here.
import { ZodError } from 'zod';
import { config } from '../config.js';
import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Express recognises error handlers by their four arguments, so `_next` has to stay.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  // Validation problems: send back a field-by-field list the form can display.
  if (err instanceof ZodError) {
    const errors = {};
    for (const issue of err.issues) {
      const field = issue.path.join('.') || 'body';
      if (!errors[field]) errors[field] = issue.message;
    }
    return res.status(400).json({ message: 'Please check the highlighted fields', errors });
  }

  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message, errors: err.details });
  }

  // Malformed JSON bodies come through as a SyntaxError from express.json().
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'The request body is not valid JSON' });
  }

  // Postgres: foreign key violation (e.g. category that does not exist).
  if (err.code === '23503') {
    return res.status(400).json({ message: 'A related record does not exist' });
  }

  console.error(err);
  res.status(500).json({
    message: 'Something went wrong on our side',
    ...(config.isProduction ? {} : { detail: err.message }),
  });
}
