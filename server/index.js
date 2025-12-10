import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import adminRoutes from "./routes/adminRoutes.js";
import clientsRoutes from "./routes/clientRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// Φόρτωση environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware για parsing JSON και URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// Routes
app.use("/", adminRoutes); //admin endpoints(login, edit)
app.use("/", clientsRoutes); // Client endpoints (register, login, edit, delete)
app.use("/", authRoutes); // Refresh token, logout κλπ.

// Error handling για routes που δεν υπάρχουν
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Εκκίνηση server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
