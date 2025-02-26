import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
const ImageSchema = new mongoose.Schema(
  {
    imageId: {
      type: String,
      default: uuidv4,
      index: true,
    },
    imgURL: {
      type: String,
      required: true,
    },
    imgOwnerId: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
    albumId: {
      type: String,
      index: true,
      required: true,
    },
    name: String,
    tags: [String],
    person: String,
    isFavorite: {
      type: Boolean,
      default: false,
    },
    comments: [
      {
        comment: String,
        commentOwnerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        commentId: {
          type: String,
          default: uuidv4,
        },
      },
    ],
    size: String,
  },
  { timestamps: true }
);

const ImageModel = mongoose.model("Image", ImageSchema);

export default ImageModel;
