class PostController {
  async getPosts(req, res) {
    res.json({ message: "Get all users" });
  }

  async getPostById(req, res) {
    const { id } = req.params;
    res.json({ message: `Get user with ID: ${id}` });
  }

  async createPost(req, res) {
    const { name, email } = req.body;
    res.status(201).json({ message: "User created", user: { name, email } });
  }
}
export default new PostController();
