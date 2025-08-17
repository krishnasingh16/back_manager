import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import ConnectTOdb from "./database.js";
import AuthRouter from "./router/auth.route.js";
import TaskRouter from "./router/task.route.js";
dotenv.config({});


const app = express();

app.get('/',(req,res)=>{
    return res.json('hello user')
})

app.use(express.json())
app.use(express.urlencoded({extended:true}));
app.use(cookieParser())
const corsOption ={
      origin:"*",
      credentials:true
}
app.use(cors(corsOption))

const PORT= process.env.PORT || 3000;

app.use("/api/v1/auth", AuthRouter)
app.use("/api/v1/task", TaskRouter)

app.listen(PORT,()=>{
    ConnectTOdb()
    console.log(`server running at http://localhost:${PORT}`);
    
})