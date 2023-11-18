import express from "express";
import * as dotenv from 'dotenv';
const app= express();
const PORT=4000;

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

app.listen(PORT,()=>console.log(`The server started in : $(PORT)`));

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
app.post("/addNote",async function(request, response) {
    const data=request.body;
    console.log(data);
    const result= await client
                        .db("Notes_making_app")
                        .collection("notes")
                        .insertOne(data);
    response.send(result);
})

//Get all notebooks
app.get("/notebooks", async function (request, response){
    const notebooks=await client
                    .db("Notes_making_app")
                    .collection("notebooks")
                    .find({})
                    .toArray();
    response.send(notebooks);
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
app.get("/notes/:id", async function (request,response){
    const {id}= request.params;
    console.log(request.params,id);
    const notesInNotebook= await client
    .db("Notes_making_app")
    .collection("notes")
    .find({id: id});
    // response.send(movie);
    notesInNotebook?response.send(notesInNotebook):response.status(404).send({msg:"No notes found in this notebook"});
});

//Get notes by note id
app.get("/fullNote/:id", async function (request,response){
    const {id}= request.params;
    console.log(request.params,id);
    const note= await client
    .db("Notes_making_app")
    .collection("notes")
    .findOne({id: id});
    // response.send(movie);
    note?response.send(note):response.status(404).send({msg:"No notes found"});
});


//delete note
app.delete("/note/:id", async function (request,response){
    const {id}= request.params;
    console.log(request.params,id);
    const result= await client
    .db("Notes_making_app")
    .collection("notes")
    .deleteOne({id:id});
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
    .updateOne({id:id},{$set: data});
    console.log(note);
    note?response.send(note):response.status(404).send({msg:"Note not updated"});
});
