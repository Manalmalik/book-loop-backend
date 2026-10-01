import { Router } from "express";
import  prisma  from "../lib/prisma";

const router = Router();


router.post("/books/bulkCreate", async (req, res, next) => {
  try {
    const books = req.body;

    if (books.length === 0 ) {
      return res.status(400).json({
        errorMessage: "no books available",
      });
    }

   const newBooks = await Promise.all(
    books.map((book: any) =>
      prisma.book.create({
        data: {
          title: book.title,
          author: book.author,
          description: book.description,
          coverUrl: book.coverUrl,
          genre: book.genre,
          totalPages: book.totalPages,
          isbn: book.isbn,
          publishedYear: book.publishedYear,
        },
      })
    )
  );

  res.status(201).json(newBooks);
  } catch (error) {
    next(error);
  }
});

router.post("/books", async (req, res, next) => {
  try {
    const {
      title,
      author,
      description,
      coverUrl,
      genre,
      totalPages,
      isbn,
      publishedYear,
    } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        errorMessage: "Title and author are required",
      });
    }

    const newBook = await prisma.book.create({
      data: {
        title,
        author,
        description,
        coverUrl,
        genre,
        totalPages,
        isbn,
        publishedYear,
      },
    });

    res.status(201).json(newBook);
  } catch (error) {
    next(error);
  }
});

router.get('/books', async(req, res, next) => {
  try{
    const allBooks = await prisma.book.findMany()
    res.status(200).json({allBooks})

  }catch(e) {
    next(e)
  }
})

// router.put('/books/:bookId', async(req, res, next) => {
//   try{
//     const {bookId} = req.params.bookId
//     const {}

//   } catch(e) {
//     next(e)
//   }

// })

export default router;