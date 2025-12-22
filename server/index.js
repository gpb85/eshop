import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRooutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import authRoutes from "./routes/authRoutes.js";

import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

// Φόρτωση environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware για parsing JSON και URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "our new funcy, old school eshop will be here soon..",
  });
});

// Routes
app.use("/", adminRoutes); //admin endpoints(login, edit)
app.use("/", userRoutes); // user endpoints
app.use("/", clientRoutes); // Client endpoints ()
app.use("/", authRoutes); // Refresh token, logout κλπ.

//products
app.use("/", productRoutes);

//orders
app.use("/", orderRoutes);

// Error handling για routes που δεν υπάρχουν
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Εκκίνηση server
app.listen(port, () => {
  console.log(`Server is listening at 0.0.0.0:${port}`);
});
