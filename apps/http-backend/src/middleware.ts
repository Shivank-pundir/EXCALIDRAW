import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { jwt_secret } from "@repo/backend-common/config";

interface MyJwtPayload {
  userId: string;
}

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export function middleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers["authorization"] ?? "";

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(403).json({
        message: "Not Authorized",
      });
    }

    const decoded = jwt.verify(
      token,
      jwt_secret
    ) as MyJwtPayload;

    req.userId = decoded.userId;

    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
}