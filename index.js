import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from "dotenv";
import cors from "cors";
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";

const app= express();
// const PORT=4000;
const PORT=process.env.PORT;
dotenv.config();
app.use(express.json());
app.use(cors({
    origin: '*'
  }));

//const MONGO_URL="mongodb://127.0.0.1";
const MONGO_URL=process.env.MONGO_URL;
async function createConnection(){
    const client= new MongoClient(MONGO_URL);
    await client.connect();
    console.log("Mongo is connected");
    return client;
}

const client= await createConnection();

app.get("/",function(request,response){
    response.send("Hi World");
});

app.listen(PORT,()=>console.log(`The server started in : ${PORT}`));

//Register endpoint
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
  
    try {
  
      // Check if the username or email already exists in the database
      const existingUser = await client.db('Notes_making_app').collection('users').findOne({ $or: [{ username }, { email }] });
  
      if (existingUser) {
        // Username or email already exists
        return res.status(409).json({ error: 'Username or email already exists. Please choose another username or email.' });
      }
  
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Store the user details in the database
      await client.db('Notes_making_app').collection('users').insertOne({
        username,
        email,
        password: hashedPassword,
      });
  
      // Return success response
      res.status(201).json({ message: 'User registered successfully.' });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });
  
// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Find the user by username
      const user = await client.db('Notes_making_app').collection('users').findOne({ username });
  
      if (!user) {
        // User not found
        return res.json({ error: 'Invalid username or password.' });
      }
  
      // Compare the provided password with the hashed password stored in the database
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        // Passwords do not match
        return res.json({ error: 'Invalid username or password.' });
      }
  
      // Passwords match, user is authenticated
      // Create and sign a JWT token
      const token = jwt.sign({ username }, process.env.SECRET_KEY, { expiresIn: '1h' });
  
      res.status(200).json({ message: 'Login successful.', token });
    } catch (error) {
      console.error('Error during login:', error);
      res.json({ error: 'Internal server error.' });
    }
  });
  

//Add new notebooks
app.post("/addNotebook",async function(request, response) {
    const data=request.body;
    console.log(data);
    const result= await client
                        .db("Notes_making_app")
                        .collection("notebooks")
                        .insertOne(data);
    response.send(result);
})

//Add new note

app.post("/addNote/:notebookId", async function(request, response) {
    const {notebookId}= request.params;
    const notebook= notebookId;
    try {
        const { heading, note, user, date } = request.body;

        // Validate that required fields are present
        if (!heading || !note || !user || !date) {
            return response.status(400).send({ msg: "Invalid request data" });
        }

        const result = await client
            .db("Notes_making_app")
            .collection("notes")
            .insertOne({ heading, note, notebook, user, date });

        response.send(result);
    } catch (error) {
        console.error("Error adding note:", error);
        response.status(500).send({ msg: "Internal server error" });
    }
});

//Get all notebooks
app.get("/notebooks/:user", async function (request, response){
    const {user}= request.params;
    const notebooks=await client
                    .db("Notes_making_app")
                    .collection("notebooks")
                    .find({user: user})
                    .toArray();
    const sortedNotebooks = notebooks.sort((a, b) => a.notebook.localeCompare(b.notebook));
    response.send(sortedNotebooks);
});

//Get all notes
app.get("/allNotes/:user", async function (request, response){
    const {user}= request.params;
    const allNotes=await client
                    .db("Notes_making_app")
                    .collection("notebooks")
                    .find({user: user})
                    .toArray();
    response.send(allNotes);
});

//Get notes by notebook id
app.get("/notes/:notebookId", async function (request, response) {
    const { notebookId } = request.params;
    console.log(notebookId);
  
    try {
      const notesInNotebook = await client
        .db("Notes_making_app")
        .collection("notes")
        .find({ notebook: notebookId })
        .toArray(); // Convert the cursor to an array
  
      if (notesInNotebook.length > 0) {
        response.send(notesInNotebook);
      } else {
        response.status(404).send({ msg: "No notes found in this notebook" });
      }
    } catch (error) {
      console.error("Error fetching notes in notebook:", error);
      response.status(500).send({ msg: "Internal server error" });
    }
  });
//Get notes by note id
app.get("/API/notes/:noteId", async function (request,response){
    const {noteId}= request.params;
    
    const note= await client
    .db("Notes_making_app")
    .collection("notes")
    .findOne({_id:new ObjectId(id)});
   console.log("note",note);
    note?response.send(note):response.status(404).send({msg:"No notes found"});
});


//delete note
app.delete("/note/:id", async function (request,response){
    const {id}= request.params;
   
    const result= await client
    .db("Notes_making_app")
    .collection("notes")
    .deleteOne({_id:new ObjectId(id)});
    //response.send(movie);
    result.deletedCount>0 ?response.send({msg:"Note deleted succesfully"}):response.status(404).send({msg:"Note not found"});
});

//Update note by id
app.put("/note/:id", async function (request,response){
    const {id}= request.params;
    const data=request.body;
    const note= await client
    .db("Notes_making_app")
    .collection("notes")
    .updateOne({_id:new ObjectId(id)},{$set: data});
    console.log(note);
    note?response.send(note):response.status(404).send({msg:"Note not updated"});
});
