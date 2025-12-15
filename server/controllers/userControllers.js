import pool from "../config/pool.js";
import bcrypt from "bcrypt";

import jwt from "jsonwebtoken";

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password required" });
    }

    const result = await pool.query(
      `SELECT * FROM users WHERE email=$1 AND role='user'`,
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ success: false, message: "Wrong email" });
    }

    if (!user.approved) {
      return res.status(403).json({
        success: false,
        message: "Your registration is not approved",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Wrong password" });
    }

    // Δημιουργία JWT tokens
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    const refreshToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    await pool.query(`UPDATE users SET refresh_token=$1 WHERE id=$2`, [
      refreshToken,
      user.id,
    ]);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      accessToken,
      refreshToken,
      user: {
        info: {
          id: user.id,
          email: user.email,
          fullName: user.full_name, // σωστό πεδίο
        },
        userState: { isApproved: user.approved, role: user.role },
        isApproved: user.approved,
        tokens: { accessToken, refreshToken },
      },
    });
  } catch (error) {
    console.error("User login failed: ", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const logOutUser = async (req, res) => {
  try {
    // Το req.user πρέπει να έχει οριστεί από το authentication middleware
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User ID missing",
      });
    }

    // Αφαίρεση του refresh token από τη βάση
    await pool.query(`UPDATE users SET refresh_token = NULL WHERE id = $1`, [
      userId,
    ]);

    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    console.error("User log out failed:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const editProfileUser = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { fullName, currentPassword, newPassword } = req.body;

    // Παίρνουμε τον χρήστη
    const result = await pool.query(`SELECT * FROM users WHERE id=$1`, [
      userId,
    ]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let updatedPasswordHash = user.password_hash;

    // Αν υπάρχει νέα password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "To change the password you must provide current password",
        });
      }

      const validPassword = await bcrypt.compare(
        currentPassword,
        user.password_hash
      );
      if (!validPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      updatedPasswordHash = await bcrypt.hash(newPassword, 10);
    }

    // Ενημέρωση fullName και passwordHash
    const updatedResult = await pool.query(
      `UPDATE users
       SET full_name=$1, password_hash=$2
       WHERE id=$3
       RETURNING id, email, role, full_name`,
      [fullName || user.full_name, updatedPasswordHash, userId]
    );

    res.status(200).json({
      success: true,
      message: newPassword
        ? "User profile & password updated successfully"
        : "User profile updated successfully",
      updatedUser: updatedResult.rows[0],
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await pool.query(
      `DELETE FROM users WHERE id=$1 RETURNING id, email, full_name`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      deletedUser: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting user profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
