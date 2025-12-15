import jwt from "jsonwebtoken";
import pool from "./../config/pool.js";

export const refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: "No token provided" });

    const result = await pool.query(
      `SELECT * FROM users WHERE refresh_token=$1`,
      [token]
    );
    const user = result.rows[0];
    if (!user) return res.status(403).json({ message: "Invalid token" });

    // Έλεγχος εγκυρότητας του refresh token
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.status(403).json({ message: "Invalid token" });

      // Δημιουργία νέου access token **μόνο αν το token είναι έγκυρο**
      const accessToken = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "10m" }
      );

      res.json({ accessToken });
    });
  } catch (error) {
    console.error("Refresh token error: ", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
