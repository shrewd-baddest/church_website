import express, { json } from 'express'
import dotenv from 'dotenv';
import cors from 'cors'
import { auth } from './routers/Authorization.js';

dotenv.config()
const app=express()
const PORT=process.env.PORT
app.use(cors());
app.use(express.json());
app.use('/authentication',auth);

app.listen(PORT,()=>{
    console.log(`server running in port ${PORT}`)
})


