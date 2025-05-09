// adminRoutes.js
import express from "express";
import {
  getAllUsers,
  getAllAccounts,
  login,
  getAllUserDetails,
  createAdmin
} from "../controllers/Admin.controllers.js";
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyAdminRole } from '../middlewares/role.middleware.js';

const router = express.Router();

router.get("/users-data", verifyToken, verifyAdminRole, getAllUserDetails);
router.get("/users", verifyToken, verifyAdminRole, getAllUsers);
router.get("/accounts", verifyToken, verifyAdminRole, getAllAccounts);
router.post("/create-admin", verifyToken, verifyAdminRole, createAdmin);
router.post('/login' , login)

export default router;
