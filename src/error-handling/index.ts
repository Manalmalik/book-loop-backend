import type {
  Express,
  Request,
  Response,
  NextFunction,
} from "express";

export default function errorHandling(app: Express): void {
  // 404 handler
  app.use(
    (_req: Request, res: Response, _next: NextFunction): void => {
      res.status(404).json({
        message: "This route does not exist",
      });
    }
  );

  // General error handler
  app.use(
    (
      err: unknown,
      req: Request,
      res: Response,
      _next: NextFunction
    ): void => {
      console.error("ERROR", req.method, req.path, err);

      if (!res.headersSent) {
        res.status(500).json({
          message: "Internal server error. Check the server console",
        });
      }
    }
  );
}