import express from "express";
import {
  registerClient,
  loginClient,
  editProfile,
  deleteProfile,
  logoutClient,
} from "../controllers/clientControllers.js";
import { validate } from "./../middleware/validate.js";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  registerClientSchema,
  loginClientSchema,
  editClientSchema,
} from "./../validators/clientValidator.js";

const router = express.Router();

//register client
router.post("/client/register", validate(registerClientSchema), registerClient);

//sign in client
router.post("/client/signin", validate(loginClientSchema), loginClient);

router.post("/client/logout", authMiddleware, logoutClient);

//edit client profile (protected)
router.patch(
  "/client/editprofile",
  authMiddleware,
  validate(editClientSchema),
  editProfile
);

//client be deleted (protected)
router.delete("/client/deleteprofile", authMiddleware, deleteProfile);

export default router;
