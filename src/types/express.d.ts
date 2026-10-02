import "express";

type JwtPayload = {
  id: number;
  email: string;
  name: string;
};

declare global {
  namespace Express {
    interface Request {
      payload?: JwtPayload;
    }
  }
}

export {};