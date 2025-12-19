import pool from "../config/pool.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// -------------------------- REGISTER CLIENT --------------------------
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
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id,email,full_name,role`,
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

// -------------------------- LOGIN CLIENT --------------------------
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
      { expiresIn: "5h" }
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

// -------------------------- LOGOUT CLIENT --------------------------
export const logoutClient = async (req, res) => {
  try {
    const clientId = req.user.id;
    console.log(clientId);

    await pool.query(`UPDATE users SET refresh_token=NULL WHERE id=$1`, [
      clientId,
    ]);
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// -------------------------- EDIT CLIENT PROFILE --------------------------
export const editProfile = async (req, res) => {
  try {
    const clientID = req.user.id;
    const { fullName, email, currentPassword, newPassword } = req.body;

    // Fetch existing user
    const userResult = await pool.query(
      `SELECT * FROM users WHERE id=$1 AND role='client'`,
      [clientID]
    );

    const client = userResult.rows[0];
    if (!client)
      return res
        .status(404)
        .json({ success: false, message: "Client not found" });

    // -------- Prevent empty update --------
    if (!fullName && !email && !newPassword) {
      return res.status(400).json({
        success: false,
        message: "No changes provided to update profile",
      });
    }

    // -------- Prevent duplicate email --------
    if (email && email !== client.email) {
      const existedEmail = await pool.query(
        `SELECT id FROM users WHERE email=$1`,
        [email]
      );

      if (existedEmail.rowCount > 0) {
        return res
          .status(400)
          .json({ success: false, message: "Email is already in use" });
      }
    }

    // -------- Handle password change --------
    let updatedPasswordHash = client.password_hash;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message:
            "To change password you must provide currentPassword and newPassword",
        });
      }

      const validPass = await bcrypt.compare(
        currentPassword,
        client.password_hash
      );
      if (!validPass) {
        return res
          .status(401)
          .json({ success: false, message: "Current password is wrong" });
      }

      updatedPasswordHash = await bcrypt.hash(newPassword, 10);
    }

    // -------- Update user --------
    const result = await pool.query(
      `UPDATE users 
       SET full_name=$1, email=$2, password_hash=$3
       WHERE id=$4
       RETURNING id, email, full_name, role`,
      [
        fullName || client.full_name,
        email || client.email,
        updatedPasswordHash,
        clientID,
      ]
    );

    res.status(200).json({
      success: true,
      message: newPassword
        ? "Profile & password updated successfully"
        : "Profile updated successfully",
      updatedClient: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// -------------------------- DELETE CLIENT ACCOUNT --------------------------
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
