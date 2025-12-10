import express from "express";

import {
  loginAdmin,
  logOutAdmin,
  editAdminProfile,
} from "./../controllers/adminControllers";

import {
  loginAdminSchema,
  editAdminSchema,
} from "./../validators/adminValidator.js";

import { validate } from "../middleware/validate.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

//sign in admin
router.post("/admin/signin", validate(loginAdminSchema), loginAdmin);

//log out admin
router.post("/admin/logout", authMiddleware, logOutAdmin);

//edit admin profile

router.patch(
  "/admin/editprofile",
  authMiddleware,
  validate(editAdminSchema),
  editAdminProfile
);

export default router;
