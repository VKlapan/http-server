import Pool from "pg-pool";

const pool = new Pool({
  user: "pg-user",
  password: "pg-password",
  host: "localhost",
  database: "testdb",
  port: 5432,
});

export default pool;
