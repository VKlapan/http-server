import { Router } from "express";
import postController from "../controllers/post.controller.js";

const router = Router();

router.get("/post", postController.getPosts);
router.get("/post/:id", postController.getPostById);
router.post("/post", postController.createPost);
export default router;
