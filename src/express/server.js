import express from "express";

import userRouter from "./routers/user.router.js";
import postRouter from "./routers/post.router.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api/", userRouter);
app.use("/api/", postRouter);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
export default app;
