import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import dotenv from "dotenv";

const app = express();
const port = 3000;
dotenv.config();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function getItems() {
    let items = [];
    const result = await db.query("SELECT * FROM notes;");
    for (let i = 0; i < result.rows.length; i++) {
        items.push(result.rows[i]);
        //console.log(result.rows[i]);
    }
    return items;
}

app.get("/", async (req, res) => {
    const data = await getItems();
    //console.log(data);
    res.render("index.ejs", { list: data });
});

//navigates to modify.ejs when new button is clicked
app.get("/new", (req, res) => {
    res.render("modify.ejs");
});
//adds the new note
app.post("/add", async (req, res) => {
    const noteTitle = req.body.title;
    const noteContent = req.body.content;
    const notePrio = req.body.priority;
    await db.query("INSERT INTO notes (title, content, priority) VALUES ($1, $2, $3)", [noteTitle, noteContent, notePrio]);
    res.redirect("/");
});
//edit functionality
//Need to pass the note's info through to modify.ejs
//need to create a different form in modify for if info is being passed in
//new post method to update the info
app.get("/edit/:id", async (req, res) => {
    //console.log(req.params.id);
    const note = await db.query("SELECT * FROM notes WHERE id=$1;", [req.params.id]);
    //console.log(note.rows[0]);
    res.render("modify.ejs", { note: note.rows[0] });
})
//create a post for /save/:id and update the note in postgres, then redirect to "/"
app.post("/save/:id", async (req, res) => {
    //console.log(req.params.id);
    //console.log(req.body.title);
    //console.log(req.body.content);
    await db.query("UPDATE notes SET title = $1, content = $2, priority = $3 WHERE id=$4;", [req.body.title, req.body.content, req.body.priority, req.params.id]);
    res.redirect("/");
});
//delete a post by id
app.get("/delete/:id", async (req, res) => {
    //console.log(req.params.id);
    try {
        //database request to delete the note
        await db.query("DELETE FROM notes WHERE id = $1;", [req.params.id]);
        //reload the main page
        res.redirect("/");
    } catch (err) {
        console.log(err);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
