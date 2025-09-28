import { Router } from "express";
import userController from "../controllers/user.controller";
const router = Router();

router.get("/user", userController.getUsers);
router.get("/user/:id", userController.getUserById);
router.post("/user", userController.createUser);
router.put("/user/:id", userController.updateUser);

export default router;
