import pool from "../config/pool.js";
import bcrypt from "bcrypt";

export const registerUser = async (req, res) => {
  try {
    const { inviteToken, fullName, password } = req.body;

    // Έλεγχος για υποχρεωτικά πεδία
    if (!inviteToken || !fullName || !password) {
      return res.status(400).json({
        success: false,
        message: "inviteToken, fullName και password είναι υποχρεωτικά",
      });
    }

    // Έλεγχος αν υπάρχει χρήστης με αυτό το inviteToken και role 'user'
    const result = await pool.query(
      `SELECT * FROM users WHERE invite_token=$1 AND role='user'`,
      [inviteToken]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Μη έγκυρο invite token",
      });
    }

    // Κάνουμε hash τον κωδικό
    const passwordHash = await bcrypt.hash(password, 10);

    // Ενημέρωση του χρήστη
    const updateResult = await pool.query(
      `UPDATE users
       SET full_name=$1, password_hash=$2, approved=true, invite_token=NULL
       WHERE id=$3
       RETURNING id, email, full_name, approved`,
      [fullName, passwordHash, user.id]
    );

    res.status(200).json({
      success: true,
      message: "Ο χρήστης εγγράφηκε επιτυχώς",
      newUser: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Σφάλμα κατά την εγγραφή χρήστη:", error);
    res.status(500).json({
      success: false,
      message: "Σφάλμα διακομιστή",
    });
  }
};
