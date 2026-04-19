import type { NextFunction, Request, Response } from "express";
import { Role } from "../../generated/prisma/enums.ts";
import { requireAuth } from "./requireAuth.ts";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (req.user?.role !== Role.admin) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}
