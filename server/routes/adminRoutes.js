import express from "express";

import {
  inviteEmployee,
  promoteEmployee,
  deleteEmployee,
  loginAdmin,
  logOutAdmin,
  editAdminProfile,
  registerAdmin,
  getAllEmployees,
} from "./../controllers/adminControllers.js";

import {
  inviteEmployeeSchema,
  promoteEmployeeSchema,
  loginAdminSchema,
  editAdminSchema,
} from "./../validators/adminValidator.js";

import { validate } from "../middleware/validate.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

//invite employee
router.post(
  "/admin/invitation",
  authMiddleware,
  validate(inviteEmployeeSchema),
  inviteEmployee
);

//promote employee
router.patch(
  "/admin/promotion",
  authMiddleware,
  validate(promoteEmployeeSchema),
  promoteEmployee
);

//get employees
router.get("/admin/users", authMiddleware, getAllEmployees);

//delete employee
router.delete("/admin/deleteEmployee", authMiddleware, deleteEmployee);

//register admin

router.post("/admin/register", registerAdmin);

//sign in admin
router.post(
  "/admin/signin",

  validate(loginAdminSchema),
  loginAdmin
);

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
