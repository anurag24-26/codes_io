import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";

// Central error handler: never leak stack traces or internal details to clients.
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof MulterError) {
    return res.status(400).json({ error: err.message });
  }

  if (err?.message?.includes("Only JPEG, PNG, or WEBP")) {
    return res.status(400).json({ error: err.message });
  }

  if (err?.message?.includes("Cloudinary is not configured")) {
    return res.status(503).json({ error: err.message });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "Route not found" });
}

// Wraps async controllers so thrown errors reach errorHandler instead of
// crashing the process or hanging the request.
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: any, res: any, next: any) => {
    fn(req, res, next).catch(next);
  };
}
