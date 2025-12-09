import pool from "../config/pool.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerClient = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    const existingClient = await pool.query(
      `SELECT * FROM users WHERE email=$1`,
      [email]
    );
    if (existingClient.rowCount > 0) {
      return res
        .status(400)
        .json({ success: false, message: "You are already registered." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role) VALUES ($1,$2,$3,$4) RETURNING id,email,full_name,role`,
      [email, password_hash, fullName, "client"]
    );

    res.status(201).json({
      success: true,
      message: "Client registered successfully",
      newClient: result.rows[0],
    });
  } catch (error) {
    console.error("Error register client:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const loginClient = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      `SELECT * FROM users WHERE email=$1 AND role=$2`,
      [email, "client"]
    );
    const client = result.rows[0];

    if (!client)
      return res
        .status(401)
        .json({ success: false, message: "Wrong email or password" });

    const validPassword = await bcrypt.compare(password, client.password_hash);
    if (!validPassword)
      return res
        .status(401)
        .json({ success: false, message: "Incorrect password" });

    const accessToken = jwt.sign(
      { id: client.id, role: client.role },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    const refreshToken = jwt.sign(
      { id: client.id, role: client.role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    await pool.query(`UPDATE users SET refresh_token=$1 WHERE id=$2`, [
      refreshToken,
      client.id,
    ]);

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      client: {
        id: client.id,
        email: client.email,
        fullName: client.full_name,
      },
    });
  } catch (error) {
    console.error("Error login client:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const logoutClient = async (req, res) => {
  try {
    const clientId = req.user.id;
    await pool.query(`UPDATE users SET refresh_token=NULL WHERE id=$1`, [
      clientId,
    ]);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const editProfile = async (req, res) => {
  try {
    const clientID = req.user.id;
    const { fullName, email } = req.body;
    const result = await pool.query(
      `UPDATE users SET full_name=$1,email=$2 WHERE id=$3 RETURNING id,email,full_name`,
      [fullName, email, clientID]
    );
    if (!result.rows[0])
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedClient: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const clientID = req.user.id;
    const result = await pool.query(
      `DELETE FROM users WHERE id=$1 RETURNING id`,
      [clientID]
    );
    if (!result.rows[0])
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });

    res
      .status(200)
      .json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
