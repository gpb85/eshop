import pool from "../config/pool.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

export const inviteEmployee = async (req, res) => {
  try {
    const { email, role, level } = req.body;

    if (!email || !role || level === undefined) {
      return res.status(400).json({
        success: false,
        message: "Email, role and level are required",
      });
    }

    // Έλεγχος έγκυρων roles
    const validRoles = ["admin", "user"];
    if (!validRoles.includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "Role must be 'admin' or 'user'" });
    }

    // Έλεγχος για levels ανά role
    if (role === "admin" && (level < 1 || level > 5)) {
      return res
        .status(400)
        .json({ success: false, message: "Admin level must be 1-5" });
    }
    if (role === "user" && (level < 1 || level > 3)) {
      return res
        .status(400)
        .json({ success: false, message: "User level must be 1-3" });
    }

    // Δημιουργία secure token
    const inviteToken = crypto.randomBytes(32).toString("hex");

    // Εισαγωγή στη βάση
    await pool.query(
      `INSERT INTO users (email, role, level, invite_token, approved) VALUES ($1,$2,$3,$4,false) RETURNING id,email,role,level`,
      [email, role, level, inviteToken]
    );

    // Link για registration
    const registerLink = `http://localhost:3000/register?token=${inviteToken}`;

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: { user: "your_email@gmail.com", pass: "email_password" },
    });

    // Αποστολή email
    await transporter.sendMail({
      from: '"Admin" <admin@example.com>',
      to: email,
      subject: "Register invitation",
      html: `<p>You have been invited to register</p>
       <p>Click <a href="${registerLink}">here</a> to complete your registration</p>`,
    });

    res
      .status(200)
      .json({ success: true, message: "Invitation sent successfully" });
  } catch (error) {
    console.error("Send invitation failed: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const promoteEmployee = async (req, res) => {
  try {
    const { role, level } = req.body;
    const { id } = req.params;

    if (!id || !role) {
      return res.status(400).json({
        success: false,
        message: "Id and role are required",
      });
    }

    const validRoles = ["admin", "user"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'admin' or 'user'",
      });
    }

    // Έλεγχος για έγκυρα επίπεδα ανά role
    const maxLevel = role === "admin" ? 5 : 3;
    const minLevel = 1;
    if (
      level === undefined ||
      isNaN(level) ||
      level < minLevel ||
      level > maxLevel
    ) {
      return res.status(400).json({
        success: false,
        message: `${role} level must be between ${minLevel} and ${maxLevel}`,
      });
    }

    // Παίρνουμε τον τρέχοντα χρήστη
    const current = await pool.query(
      `SELECT role, level FROM users WHERE id=$1`,
      [id]
    );

    if (current.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const currentUser = current.rows[0];

    // Απαγόρευση καθοδικής αλλαγής
    if (role === currentUser.role && level <= currentUser.level) {
      return res.status(400).json({
        success: false,
        message: "Cannot demote or keep same/lower level",
      });
    }

    // Ενημέρωση χρήστη
    const result = await pool.query(
      `UPDATE users
       SET role=$1, level=$2
       WHERE id=$3
       RETURNING id, email, role, level`,
      [role, level, id]
    );

    res.status(200).json({
      success: true,
      message: "Employee promoted successfully",
      promotedEmployee: result.rows[0],
    });
  } catch (error) {
    console.error("promoteEmployee failed:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `DELETE from USERS WHERE id=$1 RETURNING id,email`,
      [id]
    );
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "For admin, no user found" });
    }
    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error admin delete user: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT * FROM users WHERE email=$1 AND role='admin'`,
      [email]
    );
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Wrong email or password",
      });
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Wrong password",
      });
    }

    // Create tokens
    const accessToken = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { id: admin.id, role: admin.role },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "8h" }
    );

    // Store refresh token
    await pool.query(`UPDATE users SET refresh_token=$1 WHERE id=$2`, [
      refreshToken,
      admin.id,
    ]);

    res.status(200).json({
      success: true,
      message: "Admin login successful",
      accessToken,
      refreshToken,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Error login admin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//logout
export const logOutAdmin = async (req, res) => {
  try {
    const adminId = req.user.id;

    await pool.query(`UPDATE users SET refresh_token=NULL WHERE id=$1`, [
      adminId,
    ]);

    res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (error) {
    console.error("Admin logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//edit
export const editAdminProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { fullName, currentPassword, newPassword } = req.body;
    console.log("body", req.body);

    const result = await pool.query(`SELECT * FROM users WHERE id=$1`, [
      adminId,
    ]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    let updatedPasswordHash = admin.password_hash;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "To change your password, you must provide currentPassword",
        });
      }

      const validPassword = await bcrypt.compare(
        currentPassword,
        admin.password_hash
      );
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      updatedPasswordHash = await bcrypt.hash(newPassword, 10);
    }

    const updateResult = await pool.query(
      `
      UPDATE users 
      SET full_name=$1, password_hash=$2 
      WHERE id=$3
      RETURNING id, email, role, full_name
      `,
      [fullName || admin.full_name, updatedPasswordHash, adminId]
    );

    res.status(200).json({
      success: true,
      message: newPassword
        ? "Admin profile & password updated successfully"
        : "Admin profile updated successfully",
      updatedAdmin: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    //console.log("body: ", req.body);

    if (!email || !password || !fullName) {
      return res
        .status(404)
        .json({ success: false, message: "email password fullname required" });
    }
    const password_hash = await bcrypt.hash(password, 10);
    //console.log(password_hash);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, role, level, approved) 
   VALUES ($1, $2, $3, $4, $5, $6)
   RETURNING email, password_hash, full_name, role, level`,
      [email, password_hash, fullName, "admin", 5, true]
    );
    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      admin: result.rows[0],
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: `Server internal error ${error}` });
  }
};
