import pool from "../config/pool.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto-js";

//admin login

export const inviteUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    //generate secure random token
    const inviteToken = crypto.randomBytes(32).toString("hex");
    await pool.query(
      `INSERT INTO users (email,role,approved,invite_token) VALUES($1,'user',false,$2)`,
      [email, inviteToken]
    );
    const registerLink = nodemailer.createTransport({
      host: "smtp.example.com",
      port: 587,
      secure: false, //true for port=465
      auth: { user: "your_email_example.com", password: "your_email_password" },
    });

    await transporter.sendMail({
      from: "'admin' <admin@example.com>",
      to: email,
      subject: "Register invitation",
      html: `<p>You have been invited to register</p>
          <p>Click the link to complete registration: <a href=${registerLink}>${registerLink}</p>
      `,
    });

    res
      .status(200)
      .json({ success: true, message: "Invitation sent successfully" });
  } catch (error) {
    console.error("Error inviting user: ", error);
    res.status(500).json({ success: false, message: "Invalid server error" });
  }
};

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
        message: "Wrong email or password",
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
    const { full_name, currentPassword, newPassword } = req.body;

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
      [full_name || admin.full_name, updatedPasswordHash, adminId]
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
