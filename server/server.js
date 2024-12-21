import express from "express";
import cors from "cors";
import 'dotenv/config';
import cookieParser from "cookie-parser";
import connectDB from "./config/mongodb.js";
import { authRouter } from "./routes/authRoutes.js";

const app = express();
const port = process.env.PORT || 4004;

connectDB();
// middle wire
app.use(express.json());
app.use(cookieParser());
app.use(cors({credential: true}));


// API END point
app.get('/', (req, res)=>{
    res.send('API is working')
})
app.use('/api/auth', authRouter)

app.listen(port, ()=>{
    console.log(`server is running on port ${port}`);
})