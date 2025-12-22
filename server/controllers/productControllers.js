import pool from "./../config/pool.js";
import { generateSKU } from "../utils/helpers.js";

export const getProducts = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM products`);
    const products = result.rows;

    if (products.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No products found",
        products: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: `${products.length} products found`,
      products,
    });
  } catch (error) {
    console.error("Get products failed:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`SELECT * FROM products WHERE id=$1`, [id]);
    const product = result.rows[0];

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with id ${id} not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Product with id ${id} found successfully`,
      product,
    });
  } catch (error) {
    console.error("Get product by id failed:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// add Product
export const addProduct = async (req, res) => {
  const { id: userId, role } = req.user;
  console.log(role);

  if (role !== "admin") {
    return res
      .status(400)
      .json({ success: false, message: "Only admin can add" });
  }

  try {
    let { name, sku, description, price, stock, category } = req.body;

    if (!sku) {
      if (!category) category = "GEN";
      sku = await generateSKU(name, category);
    }

    const existing = await pool.query(`SELECT * FROM products WHERE sku=$1`, [
      sku,
    ]);
    if (existing.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: "A product with this SKU already exists",
      });
    }

    const result = await pool.query(
      `INSERT INTO products (name, sku, description, price, stock) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [name, sku, description, price, stock]
    );

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Adding product failed:", error);
    res
      .status(500)
      .json({ success: false, message: error.message, stack: error.stack });
  }
};

//edit product
export const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    let { name, description, sku, price, stock, category } = req.body;

    // Παίρνουμε το υπάρχον προϊόν
    const existingResult = await pool.query(
      `SELECT * FROM products WHERE id=$1`,
      [id]
    );

    if (existingResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: `Product with id ${id} not found`,
      });
    }

    const existing = existingResult.rows[0];

    // Αν κάποιο πεδίο δεν δίνεται, κρατάμε το υπάρχον
    const updatedName = name || existing.name;
    const updatedDescription = description || existing.description;
    const updatedPrice = price !== undefined ? price : existing.price;
    const updatedStock = stock !== undefined ? stock : existing.stock;

    // Αν δεν υπάρχει sku, το δημιουργούμε
    const updatedSku =
      sku || (await generateSKU(updatedName, category || existing.category));

    // Εκτέλεση UPDATE
    const result = await pool.query(
      `UPDATE products
       SET name=$1, sku=$2, description=$3, price=$4, stock=$5, updated_at=NOW()
       WHERE id=$6
       RETURNING *`,
      [
        updatedName,
        updatedSku,
        updatedDescription,
        updatedPrice,
        updatedStock,
        id,
      ]
    );

    res.status(200).json({
      success: true,
      message: `Product with id ${id} updated successfully`,
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Update product failed:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    if (role !== "admin") {
      return res
        .status(400)
        .json({ success: false, message: "Only admin can delete" });
    }
    const { id } = req.params;
    const existing = await pool.query(`SELECT * FROM products WHERE id=$1`, [
      id,
    ]);
    if (existing.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: `Product ${id} not found` });
    }
    const deleteProduct = await pool.query(`DELETE FROM products WHERE id=$1`, [
      id,
    ]);
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product failed: ", error);

    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
