import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const AlbumSchema = new mongoose.Schema(
  {
    albumId: {
      type: String,
      default: uuidv4,
      index: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sharedUsers: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

const AlbumModel = mongoose.model("Album", AlbumSchema);

export default AlbumModel;
