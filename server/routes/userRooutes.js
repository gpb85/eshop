import express from "express";
import {
  loginUser,
  editProfileUser,
  logOutUser,
  deleteUser,
} from "./../controllers/userControllers.js";

import {
  loginUserSchema,
  editUserSchema,
} from "./../validators/userValidator.js";

import { validate } from "./../middleware/validate.js";

import authMiddleware from "./../middleware/authMiddleware.js";

const router = express.Router();

router.post("/user/signin", validate(loginUserSchema), loginUser);

//edit profile
router.patch(
  "/user/editprofile",
  authMiddleware,
  validate(editUserSchema),
  editProfileUser
);
router.post("/user/logout", authMiddleware, logOutUser);
router.delete("/user/:id", authMiddleware, deleteUser);
export default router;
