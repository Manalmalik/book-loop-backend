import { Router, type Request } from "express";
import  prisma  from "../lib/prisma";
import { isAuthenticated } from "../middleware/jwt.middleware";

const router = Router();

router.get('/user-books', isAuthenticated, async(req,res,next) => {
    try{
        const payload = (
          req as Request & {
            payload?: { id: number; email: string; name: string };
          }
        ).payload;

        if (!payload) {
          return res.status(401).json({ errorMessage: "Authentication required" });
        }

        const userBooks = await prisma.userBook.findMany({
          where: { userId: payload.id },
          include: { book: true },
        });

        res.status(200).json({ userBooks });
    } catch(e) {
        next(e)
    }
})

router.post(
  "/user-books/:bookId",
  isAuthenticated,
  async (req, res, next) => {
    try {
      const bookId = Number(req.params.bookId);

      const payload = (
        req as Request & {
          payload?: { id: number; email: string; name: string };
        }
      ).payload;

      if (!payload) {
        return res.status(401).json({ errorMessage: "Authentication required" });
      }

      const userId = payload.id;

      if (!bookId) {
        return res.status(400).json({
          errorMessage: "Book ID is required",
        });
      }

      // Check that the book exists
      const book = await prisma.book.findUnique({
        where: {
          id: bookId,
        },
      });

      if (!book) {
        return res.status(404).json({
          errorMessage: "Book not found",
        });
      }

      // Check whether the user already has this book
      const existingUserBook = await prisma.userBook.findUnique({
        where: {
          userId_bookId: {
            userId,
            bookId,
          },
        },
      });

      let userBook;

      if (existingUserBook) {
        userBook = await prisma.userBook.update({
          where: {
            id: existingUserBook.id,
          },
          data: {
            status:  req.body.status,
            startedAt: existingUserBook.startedAt ?? new Date(),
          },
        });
      } else {
        userBook = await prisma.userBook.create({
          data: {
            userId,
            bookId,
            status:req.body.status,
            currentPage: 0,
            startedAt: new Date(),
          },
        });
      }

      res.status(200).json(userBook);
    } catch (error) {
      next(error);
    }
  }
);

router.patch("/user-books/:bookId", isAuthenticated, async (req, res, next) => {
  try {
    const bookId = Number(req.params.bookId);
    const payload = (
      req as Request & {
        payload?: { id: number; email: string; name: string };
      }
    ).payload;

    if (!payload) {
      return res.status(401).json({ errorMessage: "Authentication required" });
    }

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({ errorMessage: "A valid book ID is required" });
    }

    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({ errorMessage: "Request body must be an object" });
    }

    const body = req.body as Record<string, unknown>;
    const data: {
      status?: "WANT_TO_READ" | "READING" | "FINISHED";
      currentPage?: number;
      rating?: number | null;
      notes?: string | null;
      startedAt?: Date | null;
      finishedAt?: Date | null;
    } = {};

    if (body.status !== undefined) {
      if (!["WANT_TO_READ", "READING", "FINISHED"].includes(body.status as string)) {
        return res.status(400).json({ errorMessage: "Invalid reading status" });
      }
      data.status = body.status as "WANT_TO_READ" | "READING" | "FINISHED";
    }

    if (body.currentPage !== undefined) {
      if (typeof body.currentPage !== "number" || !Number.isInteger(body.currentPage) || body.currentPage < 0) {
        return res.status(400).json({ errorMessage: "currentPage must be a non-negative integer" });
      }
      data.currentPage = body.currentPage;
    }

    if (body.rating !== undefined) {
      if (body.rating !== null && (typeof body.rating !== "number" || !Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5)) {
        return res.status(400).json({ errorMessage: "rating must be an integer from 1 to 5, or null" });
      }
      data.rating = body.rating as number | null;
    }

    if (body.notes !== undefined) {
      if (body.notes !== null && typeof body.notes !== "string") {
        return res.status(400).json({ errorMessage: "notes must be a string or null" });
      }
      data.notes = body.notes as string | null;
    }

    for (const field of ["startedAt", "finishedAt"] as const) {
      const value = body[field];
      if (value === undefined) continue;
      if (value === null) {
        data[field] = null;
      } else if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
        return res.status(400).json({ errorMessage: `${field} must be a valid date string or null` });
      } else {
        data[field] = new Date(value);
      }
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ errorMessage: "Provide at least one field to update" });
    }

    const where = {
      userId_bookId: {
        userId: payload.id,
        bookId,
      },
    };
    const existingUserBook = await prisma.userBook.findUnique({ where });

    if (!existingUserBook) {
      return res.status(404).json({ errorMessage: "Book is not in this user's library" });
    }

    const updatedUserBook = await prisma.userBook.update({
      where,
      data,
      include: { book: true },
    });

    return res.status(200).json(updatedUserBook);
  } catch (error) {
    next(error);
  }
});

router.delete("/user-books/:bookId", isAuthenticated, async (req, res, next) => {
  try {
    const bookId = Number(req.params.bookId);
    const payload = (
      req as Request & {
        payload?: { id: number; email: string; name: string };
      }
    ).payload;

    if (!payload) {
      return res.status(401).json({ errorMessage: "Authentication required" });
    }

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({ errorMessage: "A valid book ID is required" });
    }

    const result = await prisma.userBook.deleteMany({
      where: {
        userId: payload.id,
        bookId,
      },
    });

    if (result.count === 0) {
      return res.status(404).json({ errorMessage: "Book is not in this user's library" });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});



export default router