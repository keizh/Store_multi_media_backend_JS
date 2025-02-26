import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "../Routes/AuthRoutes";
import dbConnect from "../utils/dbConnectFunction";
import { v2 as cloudinary } from "cloudinary";
import { AlbumRouter } from "../Routes/AlbumRoute";
import { imageRouter } from "../Routes/ImageRoutes";
dbConnect();

const app = express();

const corsOptions = {
  origin: ["https://kovias-pix-frontend.vercel.app", "http://localhost:5173"],
  allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Accept", "Authorization"],
  credentails: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/album", AlbumRouter);
app.use("/api/v1/image", imageRouter);

app.get("/", (req, res) => {
  res.status(200).send("working");
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5500;

app.listen(PORT, () => console.log(`Web-server is Online`));
