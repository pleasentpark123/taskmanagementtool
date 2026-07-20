import {errorHandler, notFoundHandler} from "./middleware/errorHandler";
import router from "./routes/auth.routes";
import cookieParser from "cookie-parser";
import express from "express";
const app = express()

app.use(express.json())
app.use(cookieParser())
app.use('/auth',router)
app.use(notFoundHandler)
app.use(errorHandler)
export default app