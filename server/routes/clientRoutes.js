import express from "express";
import {
  registerClient,
  loginClient,
  editProfile,
  deleteProfle,
} from "../controllers/clientsControllers.js";

const router = express.Router();

//register client

router.post("/client/register", registerClient);

//sign in client

router.post("/client/signin", loginClient);

//edit client profile

router.patch("/client/editprofile", editProfile);

//client be deleted

router.delete("/client/deleteprofile", deleteProfle);
