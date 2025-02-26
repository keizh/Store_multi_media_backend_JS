import { Router } from "express";
import multer from "multer";
import ImageModel from "../models/ImageModel.js";
import { v2 as cloudinary } from "cloudinary";
import authorizedAccess from "../utils/authorizedAccess.js";
const uploads = multer({
  storage: multer.diskStorage({}),
  limits: {
    fileSize: 11 * 1024 * 1024,
  },
});

export const imageRouter = Router();
// RESPONSIBLE FOR UPLOADING IMAGE
imageRouter.post(
  "/imgs",
  authorizedAccess,
  uploads.array("images", 10),
  async (req, res) => {
    const files = req.files;
    const { userId } = req.user;
    const { albumId, name, tags } = req.body;
    try {
      // console.log(`-->`, albumId, name, tags);
      const savedImages = [];
      for (const file of files) {
        const uploaded = await cloudinary.uploader.upload(file.path);
        const newImage = new ImageModel({
          imgURL: uploaded.secure_url,
          public_id: uploaded.public_id,
          imgOwnerId: userId,
          albumId: albumId,
          name,
          tags: JSON.parse(tags),
          size: file.size,
          person: "",
          comments: [],
          isFavorite: false,
        });

        const newImageSaved = await newImage.save();
        savedImages.push(newImageSaved);
      }
      // console.log(savedImages);
      res.status(200).json({
        message: "Image has been uploaded",
        savedImages,
        tags: savedImages[0].tags,
      });
    } catch (err) {
      const mssg =
        err instanceof Error ? err.message : "Failed to upload image";
      res.status(500).json({ message: mssg });
    }
  }
);

// RESPONSIBLE FOR MARKING THE STAR FAVORITE
imageRouter.post("/isFavoriteIMG", authorizedAccess, async (req, res) => {
  const { imageId } = req.query;
  const { isFavorite } = req.body;
  try {
    const updateImage = await ImageModel.findOneAndUpdate(
      { imageId },
      { $set: { isFavorite } },
      { new: true }
    );
  } catch (err) {
    const mssg = err instanceof Error ? err.message : "";
    res.status(500).json({ message: mssg });
  }
});

// RESPONSIBLE FOR ADDING COMMENT
imageRouter.post("/comment/add", authorizedAccess, async (req, res) => {
  const { comment, imageId, commentId } = req.body;
  const { userId } = req.user;
  try {
    const comment_OBJ = {
      comment,
      commentOwnerId: userId,
      commentId,
    };
    const imageWithCommentAdded = await ImageModel.findOneAndUpdate(
      {
        imageId,
      },
      {
        $addToSet: { comments: comment_OBJ },
      }
    );
    if (imageWithCommentAdded) {
      res.status(200).json({ message: `Comment added`, comment_OBJ });
    } else {
      res.status(404).json({ message: `No such Image Exists` });
    }
  } catch (err) {
    const mssg = err instanceof Error ? err.message : "Failed to add Comment";
    res.status(500).json({ message: mssg });
  }
});

// RESPONSIBLE FOR REMOVING COMMENT
imageRouter.post("/comment/remove", authorizedAccess, async (req, res) => {
  const { commentId, imageId, imgOwnerId } = req.body;
  const { userId } = req.user;
  try {
    const imageWithCommentRemoved = await ImageModel.findOneAndUpdate(
      {
        imageId,
      },
      {
        $pull: { comments: { commentId, commentOwnerId: userId } },
      }
    );
    if (imageWithCommentRemoved) {
      res.status(200).json({ message: `Comment removed` });
    } else {
      res.status(404).json({ message: `No such Image Exists` });
    }
  } catch (err) {
    const mssg =
      err instanceof Error ? err.message : "Failed to remove Comment";
    res.status(500).json({ message: mssg });
  }
});

imageRouter.delete(`/delete/:imageId`, authorizedAccess, async (req, res) => {
  try {
    const { userId } = req.user;
    const { imageId } = req.params;
    // console.log(`imageId`, imageId);
    // console.log(`userId`, userId);
    const Img = await ImageModel.findOne({
      imageId,
      imgOwnerId: userId,
    });
    // console.log(Img);
    const deletedImg = await ImageModel.findOneAndDelete({
      imageId,
      imgOwnerId: userId,
    });
    console.log(deletedImg);
    if (deletedImg && Img) {
      await cloudinary.uploader.destroy(Img.public_id);
      res.status(200).json({ message: `Image Successfully deleted` });
    } else {
      throw new Error(`Failed to Delete Image`);
    }
  } catch (err) {
    const mssg = err instanceof Error ? err.message : "Failed to delete Image";
    res.status(500).json({ message: mssg });
  }
});

imageRouter.get("/:albumId", authorizedAccess, async (req, res) => {
  // console.log(`line 202`);
  const { albumId } = req.params;
  // console.log(albumId);
  try {
    const images = await ImageModel.find({
      albumId,
    });
    // console.log(images);
    const tags = Array.isArray(images)
      ? Array.from(
          new Set(
            images.reduce((acc, img) => {
              const tagList = Array.isArray(img.tags) ? img.tags : [];
              return [...acc, ...tagList];
            }, [])
          )
        )
      : [];
    // console.log(tags);
    // console.log(`line 221`);
    res.status(200).json({ message: "Images have been fetched", images, tags });
    // console.log(`line 225`);
  } catch (err) {
    const mssg = err instanceof Error ? err.message : "Failed to delete Image";
    res.status(500).json({ message: mssg });
    // console.log(`line 230`);
  }
});

imageRouter.get("/:albumId/favorite", authorizedAccess, async (req, res) => {
  const { albumId } = req.params;
  try {
    const images = await ImageModel.find({
      albumId,
      isFavorite: true,
    });
    res.status(200).json({ message: "Images have been fetched", images });
  } catch (err) {
    const mssg = err instanceof Error ? err.message : "Failed to delete Image";
    res.status(500).json({ message: mssg });
  }
});

imageRouter.get("/:albumId/tags", authorizedAccess, async (req, res) => {
  const { albumId } = req.params;
  const { tagName } = req.query;
  try {
    const images = await ImageModel.find({
      albumId,
      tags: { $in: [tagName] },
    });
    res.status(200).json({ message: "Images have been fetched", images });
    return;
  } catch (err) {
    const mssg = err instanceof Error ? err.message : "Failed to delete Image";
    res.status(500).json({ message: mssg });
    return;
  }
});

// responsible for marking image as favorite
imageRouter.post("/markFavorite/:id", authorizedAccess, async (req, res) => {
  // console.log(`line 302 haws been hit ----->`);
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: `Image Id not provided` });
      return;
    }

    const imageIsMadeFavorite = await ImageModel.findByIdAndUpdate(
      id,
      {
        $set: { isFavorite: true },
      },
      { new: true }
    );

    res.status(200).json({ message: `Image marked liked` });
  } catch (err) {
    res.status(500).json({ message: `Failed to Like Image` });
  }
});

// responsible for unmarking image as favorite
imageRouter.post("/markUnFavorite/:id", authorizedAccess, async (req, res) => {
  // console.log(`line 326 haws been hit ----->`);
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "Image Id not provided" });
      return;
    }

    const imageIsMarkedNonFavorite = await ImageModel.findByIdAndUpdate(
      id,
      { $set: { isFavorite: false } },
      { new: true }
    );

    res.status(200).json({ message: "Img has been unliked" });
  } catch (err) {
    res.status(500).json({ message: "Failed to unLike Image" });
  }
});
