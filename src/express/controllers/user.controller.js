import db from "../db.js";

class UserController {
  async getUsers(req, res) {
    const users = await db.query("SELECT * FROM users");
    res.status(200).json({ message: "Get all users", users: users.rows });
  }

  async getUserById(req, res) {
    const { id } = req.params;
    res.json({ message: `Get user with ID: ${id}` });
  }

  async createUser(req, res) {
    const { name, surname, email } = req.body;
    try {
      const newUser = await db.query(
        "INSERT INTO users (name, surname, email) VALUES ($1, $2, $3) returning *",
        [name, surname, email]
      );

      console.dir(newUser.rows[0]);
      res.status(201).json({ message: "User created", user: { name, email } });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateUser(req, res) {
    const { id } = req.params;
    const { name, surname, email } = req.body;
    await db.query(
      "UPDATE users SET name = $1, surname = $2, email = $3 WHERE id = $4",
      [name, surname, email, id]
    );
    res.json({ message: `User with ID: ${id} updated`, user: { name, email } });
  }
}
export default new UserController();
