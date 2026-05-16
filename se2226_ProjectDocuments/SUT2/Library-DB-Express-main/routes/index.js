var express = require('express');
var router = express.Router();

//import the Book model from the ../models folder
const { Book } = require('../models');

//import sequelize comparison operators
const { Op } = require('sequelize');

// Handler Function for Async Functions
function asyncHandler(callback){
  return async(req, res, next) => {
    try {
      await callback(req, res, next)
    } catch(error){
      // Forward error to the global error handler
      next(error);
    }
  }
}

/* GET home page. */
router.get('/', asyncHandler(async (req, res, next) => {
  res.redirect('/books');
}));

/* GET books page with search results */
router.get('/books', asyncHandler(async (req, res, next) => {
  const search = req.query.search;
  let books;
  let bookCount;
  const page = req.query.page || 1;

  if(search) {
    books = await Book.findAndCountAll({  
      where: {
        [Op.or]: [
          {
            title: {
              [Op.like]: `%${search}%`
            }
          },
            {
            author: {
              [Op.like]: `%${search}%`
            }
          },
            {
            genre: {
              [Op.like]: `%${search}%`
            }
          },
            {
            year: {
              [Op.like]: `%${search}%`
            }
          } 
        ]
      },
      limit: 5,
      offset: page * 5 - 5,
      page,
    })
    bookCount = books.count;
    pageCount = Math.ceil(bookCount / 5);
  } else {
    books = await Book.findAndCountAll({
      limit: 5,
      offset: page*5 -5,
    });
  }
  bookCount = books.count;
  pageCount = Math.ceil(bookCount / 5);
  
  //logs
  // console.log(search);
  // console.log(bookCount);
  // console.log(pageCount);
  // console.log(page);

  res.render('index', { 
    books: books.rows,
    pageCount,
    bookCount,
    page,
    search
  });
}));

/* GET new-book page, shows the create new book form*/
router.get('/books/new', (req, res) => {
  res.render('new-book', {book: {}, title: "New Book"});
});

/* POST New Book, posts a new book to the database*/
router.post('/books/new', asyncHandler(async(req, res) => {
  let book;
  try{
    book = await Book.create(req.body);
    res.redirect("/books");
  } catch (error) {
    if(error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message)
      res.render('new-book', {errors, book, title: "New Book"});
    } else {
      throw error;
    }
  }
}));

/* GET books/:id page, renders book deatil form*/
router.get('/books/:id', asyncHandler(async(req, res) => {
  const book = await Book.findByPk(req.params.id);
  res.render('update-book', {book, title: book.title});
}));

/* POST /books/:id, updates book info in the database*/
router.post('/books/:id', asyncHandler(async(req, res) => {
  const book = await Book.findByPk(req.params.id);
  try{
    await book.update(req.body);
    res.redirect('/books');
  } catch (error) {
    if(error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => err.message);
      res.render('update-book', {errors, book, title: book.title});
    } else {
      throw error;
    }
  }
}));

/* POST /books/:id/delete, deletes a book*/
router.post('/books/:id/delete', asyncHandler(async(req, res) => {
  const book = await Book.findByPk(req.params.id);
  await book.destroy();
  res.redirect('/books');
}))

module.exports = router;

