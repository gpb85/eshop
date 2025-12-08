import bodyParser from "body-parser";
import express from "express";
import pool from "./config/pool.js";

import { dirname } from "path";
import { fileURLToPath } from "url";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.status(201).json({ success: true, message: "Everything ok" });
});

app.listen(port, () =>
  console.log(`Server listening at http://localhost:${port}`)
);
