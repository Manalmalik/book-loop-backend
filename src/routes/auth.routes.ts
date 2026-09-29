import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma";

// This keeps your existing JavaScript middleware working.
const { isAuthenticated } = require("../middleware/jwt.middleware");

const router = Router();

const saltRounds = 10;

interface AuthenticatedRequest extends Request {
  payload?: unknown;
}

// POST /auth/signup
router.post(
  "/signup",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({
          message: "Provide email, password and name",
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: "Provide a valid email address.",
        });
      }

      const passwordRegex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;

      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          message:
            "Password must have at least 6 characters and contain at least one number, one lowercase and one uppercase letter.",
        });
      }

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(400).json({
          message: "User already exists.",
        });
      }

      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const createdUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      const user = {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
      };

      return res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  }
);

// POST /auth/login
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          message: "Provide email and password.",
        });
      }

      const foundUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!foundUser) {
        return res.status(401).json({
          message: "User not found.",
        });
      }

      const passwordCorrect = await bcrypt.compare(
        password,
        foundUser.password
      );

      if (!passwordCorrect) {
        return res.status(401).json({
          message: "Unable to authenticate the user",
        });
      }

      const tokenSecret = process.env.TOKEN_SECRET;

      if (!tokenSecret) {
        throw new Error("TOKEN_SECRET is not defined");
      }

      const payload = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
      };

      const authToken = jwt.sign(payload, tokenSecret, {
        algorithm: "HS256",
        expiresIn: "6h",
      });

      return res.status(200).json({ authToken, payload });
    } catch (error) {
      next(error);
    }
  }
);

// GET /auth/verify
router.get(
  "/verify",
  isAuthenticated,
  (req: AuthenticatedRequest, res: Response) => {
    return res.status(200).json(req.payload);
  }
);

export default router;