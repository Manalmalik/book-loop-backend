import { Router } from "express";
import  prisma  from "../lib/prisma";

const router = Router();

// router.post("/books", async (req, res, next) => {
//   try {
//     const {
//       title,
//       author,
//       coverUrl,
//       genre,
//       totalPages,
//       status,
//       currentPage,
//       rating,
//       notes,
//       userId,
//     } = req.body;

//     if (!title || !author || !userId) {
//       return res.status(400).json({
//         errorMessage: "Title, author and user are required",
//       });
//     }

//     const newBook = await prisma.book.create({
//       data: {
//         title,
//         author,
//         coverUrl,
//         genre,
//         totalPages,
//         status: status || "want_to_read",
//         currentPage: currentPage || 0,
//         rating,
//         notes,
//         userId,
//       },
//     });

//     res.status(201).json(newBook);
//   } catch (error) {
//     next(error);
//   }
// });

export default router;