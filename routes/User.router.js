import { Router } from "express";
import {
  register,
  login,
  refreshAccessToken,
  logout,
} from "../controllers/User.controllers.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/token/refresh", refreshAccessToken);
router.post("/logout", logout);

export default router;
