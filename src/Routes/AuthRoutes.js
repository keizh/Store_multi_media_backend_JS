import express, { Router, Request, Response } from "express";
import mongoose, { HydratedDocument } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserModel from "../models/UserModel";
import { User, LoginORSignUpResponse, UserDocInterface } from "../types";
import "dotenv/config";
import { OptionalId } from "mongodb";
import authorizedAccess from "../utils/authorizedAccess";

const authRouter = Router();

// PRODUCTION READY <-- google/ouath/redirection
authRouter.get("/google/oauth", (req, res) => {
  const googleOAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_BACKEND_REDIRECT_URI}&response_type=code&scope=profile email`;
  res.redirect(googleOAuthURL);
});

// PRODUCTION READY <-- google/callback/redirection
authRouter.get("/google/oauth/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const params = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: process.env.GOOGLE_BACKEND_REDIRECT_URI ?? "",
      grant_type: "authorization_code",
    };
    const fetchedData = await fetch(`https://oauth2.googleapis.com/token`, {
      method: "POST",
      body: new URLSearchParams(params).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
    });
    const { access_token } = await fetchedData.json();

    // id & email
    const fetchRes2 = await fetch(
      "https://www.googleapis.com/oauth2/v1/userinfo",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    const data2 = await fetchRes2.json();
    const { email, id } = data2;

    // Fetching User Email Id
    const user = await UserModel.findOne({ email });

    if (!user) {
      // WHEN USER DOESNOT EXIST
      // CREATE NEW USER
      // SEND JWT
      const newUser = new UserModel({ email, userId: id });
      const newUserSaved = await newUser.save();
      const token = jwt.sign(
        {
          email: newUserSaved.email,
          userId: newUserSaved._id,
        },
        process.env.SECRET_KEY ?? "",
        { expiresIn: "10h" }
      );
      res.redirect(
        `${process.env.frontendURL}/user/auth/photos?token=${token}`
      );
      return;
    }
    // USER EXISTS
    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id,
      },
      process.env.SECRET_KEY ?? "",
      { expiresIn: "10h" }
    );
    res.redirect(`${process.env.frontendURL}/user/auth/photos?token=${token}`);
    return;
  } catch (err) {
    res.redirect(
      `${process.env.frontendURL}/user/login?issue=${
        err instanceof Error && err.message
      }`
    );
  }
});

authRouter.get("/fetch/users", authorizedAccess, async (req, res) => {
  const { email } = req.user;
  try {
    const userList = await UserModel.find({
      email: { $nin: [email] },
    });
    res.status(200).json({ message: "Users Fetched", userList });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

export default authRouter;
