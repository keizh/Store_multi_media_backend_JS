import { Router } from "express";
import AlbumModel from "../models/AlbumModel.js";
import ImageModel from "../models/ImageModel.js";
import { v2 as cloudinary } from "cloudinary";
import authorizedAccess from "../utils/authorizedAccess.js";
export const AlbumRouter = Router();
import mongoose from "mongoose";

// RESPONSIBLE FOR CREATING NEW ALBUM
AlbumRouter.post("/", authorizedAccess, async (req, res) => {
  try {
    const { name, ownerId, description } = req.body;
    if (!name || !description || !ownerId) {
      res
        .status(400)
        .json({ message: "Need Name & Description to create album" });
    }
    const newAlbum = new AlbumModel({
      name,
      description,
      ownerId,
    });
    const newAlbumSaved = await newAlbum.save();
    if (newAlbumSaved) {
      res
        .status(201)
        .json({ message: `${name} Album Created`, Album: newAlbumSaved });
    } else {
      res.status(200).json({ message: `${name} Album Creation Failed` });
    }
    return;
  } catch (err) {
    res.status(500).json({ message: `Failed To Create Album` });
  }
});

// RESPONSIBLE FOR BOTH SHARING & UPDATING DESCRITION
AlbumRouter.post("/:albumId", authorizedAccess, async (req, res) => {
  const { description, sharedUsers } = req.body;
  const { albumId } = req.params;
  // console.log(description, sharedUsers);
  // console.log(albumId);

  const { userId } = req.user;

  try {
    const albumFetched = await AlbumModel.findOne({
      albumId,
      ownerId: new mongoose.Types.ObjectId(userId),
    });
    // console.log(albumFetched);
    if (albumFetched && albumFetched.ownerId.toString() === userId.toString()) {
      const updatedAlbum = await AlbumModel.findOneAndUpdate(
        { albumId },
        { $set: { description, sharedUsers } },
        { new: true }
      );
      if (updatedAlbum) {
        res.status(200).json({ message: `Album  updated`, updatedAlbum });
      }
    } else {
      res.status(404).json({ message: `You are not Album Owner` });
    }
  } catch (err) {
    res
      .status(500)
      .json({ message: `${err instanceof Error ? err.message : ""}` });
  }
});

// RESPONSIBLE FOR DELETING THE ALBUM
AlbumRouter.delete("/:albumId", authorizedAccess, async (req, res) => {
  const { albumId } = req.params;

  const { userId } = req.user;
  try {
    const album = await AlbumModel.findOne({
      albumId,
    }).lean();

    if (album && album?.ownerId.toString() === userId.toString()) {
      const imgLinkedToThisAlbum = await ImageModel.find(
        { albumId },
        { public_id: 1, _id: 0 }
      ).lean();
      const publicIDs = imgLinkedToThisAlbum.map((ele) => ele.public_id);
      // console.log(publicIDs);
      const deletedAlbum = await AlbumModel.findOneAndDelete({ albumId });
      await ImageModel.deleteMany({ albumId });
      // console.log(acc);
      if (publicIDs.length > 0) {
        await cloudinary.api.delete_resources(publicIDs);
      }
      res.status(200).json({ message: "Album Successfully deleted" });
    } else if (album && album?.ownerId.toString() != userId.toString()) {
      res.status(403).json({ message: "Only Album Onwer can Delete" });
    } else {
      res.status(404).json({ message: "Album Not Found" });
    }
  } catch (err) {
    res.status(500).json({ message: err instanceof Error ? err.message : "" });
  }
});

// RESPONSIBLE FOR FETCHING ALL ALBUMS OWNED BY USER
AlbumRouter.get("/owner", authorizedAccess, async (req, res) => {
  const { userId } = req.user;
  try {
    const fetchAlbums = await AlbumModel.find({
      ownerId: userId,
    });
    res
      .status(200)
      .json({ albums: fetchAlbums, message: "Fetched albums owned by you" });
  } catch (err) {
    res.status(500).json({
      message: `${
        err instanceof Error ? err.message : "Failed to Fetch Albums"
      }`,
    });
  }
});

// RESPONSIBLE FOR FETCHING ALL ALBUMS SHARE TO USER
AlbumRouter.get("/shared", authorizedAccess, async (req, res) => {
  const { email } = req.user;
  try {
    const fetchAlbums = await AlbumModel.find({
      sharedUsers: { $in: [email] },
    });

    res.status(200).json({
      albums: fetchAlbums,
      message: "Fetched albums shared with you",
    });
  } catch (err) {
    res.status(500).json({
      message: `${
        err instanceof Error ? err.message : "Failed to Fetch Albums"
      }`,
    });
  }
});

AlbumRouter.get("/details/:albumId", async (req, res) => {
  try {
    const { albumId } = req.params;
    const data = await AlbumModel.findOne({ albumId });
    console.log(`204 --->`, data);
    console.log(`205 ---> albumId`, albumId);
    if (data) {
      res.status(200).json({ message: "Fetch Album details", album: data });
    } else {
      res.status(400).json({ message: "Failed to Fetch Album Details" });
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get album Details";
    res.status(500).json({ message });
  }
});
