const express = require("express");
const path = require("path");
const app = express();
const mongoose = require("mongoose");
const Article = require("./models/article");
const bodyParser = require("body-parser");
const { check, validationResult } = require("express-validator");
const flash = require("connect-flash");
const session = require("express-session");

mongoose.connect("mongodb://localhost/nodekb", {
  useUnifiedTopology: true,
  useNewUrlParser: true
});
let db = mongoose.connection;

//check connection
db.once("open", () => {
  console.log("Connected MongoDb Successfully!!");
});
//check err
db.on("error", err => {
  console.log(err);
});

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

//Express Session Middleware
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: true
  })
);
app.use(flash());
//Express Messages Middleware
/* app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});  */

app.use((req, res, next) => {
  res.locals.errors = req.flash("error");
  res.locals.successes = req.flash("success");
  next();
});

app.get("/", (req, res) => {
  // res.send('Hello World!!');
  /*   let articles = [
       {id: 1, title: 'This is firstOne', author: 'authorOne'},
       {id: 2, title: 'This is SecondOne', author: 'SecondOne'},
       {id: 3, title: 'This is ThirdOne', author: 'ThirdOne'},
       {id: 4, title: 'This is FourthOne', author: 'FourthOne'},
   ]; */
  Article.find({}, (err, articles) => {
    if (err) {
      console.log(err);
    } else {
      res.render("index", {
        title: "Articles",
        articles: articles
      });
    }
  });
});

app.get("/articles/add", (req, res) => {
  res.render("add_articles", {
    title: "Add Articles"
  });
});

// Add Submit POST Route
app.post(
  "/articles/add",
  [
    check("title", "Title is required")
      .not()
      .isEmpty(),
    check("author", "Author is required")
      .not()
      .isEmpty(),
    check("body", "Body is required")
      .not()
      .isEmpty()
  ],
  (req, res) => {
    const errors = validationResult(req);

    if (errors) {
      res.render("add_articles", {
        title: "Add Articles",
        errors: errors
      });
    } else {
      //GetErrors
      let article = new Article();
      article.title = req.body.title;
      article.author = req.body.author;
      article.body = req.body.body;

      article.save(err => {
        if (err) {
          console.log(err);
          return;
        } else {
          req.flash("success", "Article Added");
          res.redirect("/");
        }
      });
    }
  }
);

// Get Single Article
app.get("/article/:id", (req, res) => {
  Article.findById(req.params.id, (err, article) => {
    res.render("article", {
      article: article
    });
  });
});

// Load Edit Article
app.get("/articles/edit/:id", (req, res) => {
  Article.findById(req.params.id, (err, article) => {
    res.render("edit_article", {
      title: "Edit Article",
      article: article
    });
  });
});

// Update Submit POST Route
app.post("/articles/edit/:id", (req, res) => {
  let article = {};
  article.title = req.body.title;
  article.author = req.body.author;
  article.body = req.body.body;

  let query = { _id: req.params.id };

  Article.update(query, article, err => {
    if (err) {
      console.log(err);
      return;
    } else {
      req.flash("success", "Article Updated");
      res.redirect("/");
    }
  });
});

// Delete Route
app.delete("/article/:id", (req, res) => {
  let query = { _id: req.params.id };
  Article.remove(query, err => {
    if (err) {
      console.log(err);
    } else {
      req.flash("success", "Delete Success");
      res.send("Delete Success");
    }
  });
});

app.listen(3000, () => console.log("Server is running on port 3000...."));
