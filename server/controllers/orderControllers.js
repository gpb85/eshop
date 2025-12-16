import pool from "../config/pool.js";

export const createOrder = async (req, res) => {
  const clientId = req.user.id;
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No items provided" });
  }

  const connection = await pool.connect();

  try {
    await connection.query("BEGIN");

    let total = 0;

    // 1️⃣ Έλεγχος & υπολογισμός
    for (const item of items) {
      const productResult = await connection.query(
        `SELECT * FROM products WHERE id=$1 AND is_active=true`,
        [item.product_id]
      );

      if (productResult.rowCount === 0) {
        throw new Error(`Product ${item.product_id} not found or inactive`);
      }

      const product = productResult.rows[0];
      const quantity = parseInt(item.quantity);

      if (quantity > product.stock) {
        throw new Error(`Product ${product.name} is out of stock`);
      }

      total += parseFloat(product.price) * quantity;
    }

    // 2️⃣ στρογγυλοποίηση ΜΙΑ ΦΟΡΑ
    total = Math.round(total * 100) / 100;

    // 3️⃣ δημιουργία order
    const orderResult = await connection.query(
      `INSERT INTO orders (client_id, total) VALUES ($1,$2) RETURNING *`,
      [clientId, total]
    );
    const order = orderResult.rows[0];

    // 4️⃣ order_items + stock
    for (const item of items) {
      const productResult = await connection.query(
        `SELECT * FROM products WHERE id=$1`,
        [item.product_id]
      );

      const product = productResult.rows[0];
      const quantity = parseInt(item.quantity);
      const newStock = product.stock - quantity;

      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1,$2,$3,$4)`,
        [order.id, product.id, quantity, product.price]
      );

      await connection.query(
        `UPDATE products 
         SET stock=$1, is_active=$2
         WHERE id=$3`,
        [newStock, newStock === 0 ? false : true, product.id]
      );
    }

    await connection.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      orderId: order.id,
      total,
    });
  } catch (error) {
    await connection.query("ROLLBACK");
    res.status(400).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const clientId = req.user.id;
    const { status } = req.query;

    let query = `SELECT * FROM orders WHERE client_id = $1`;
    let values = [clientId];

    if (status) {
      query += ` AND status = $2`;
      values.push(status);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);

    return res.status(200).json({
      success: true,
      count: result.rowCount,
      orders: result.rows,
    });
  } catch (error) {
    console.error("Get client orders error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    const clientId = req.user.id;

    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id=$1 AND client_id=$2`,
      [orderId, clientId]
    );

    if (orderResult.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "No order found for this client",
      });
    }

    const order = orderResult.rows[0];

    res.status(200).json({
      success: true,
      message: "Order found successfully",
      order,
    });
  } catch (error) {
    console.error("Error loading order: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const cancelOrder = async (req, res) => {
  const clientId = req.user.id;
  const { id: orderId } = req.params;

  const connection = await pool.connect();

  try {
    await connection.query("BEGIN");

    // Έλεγχος παραγγελίας
    const orderResult = await connection.query(
      `SELECT * FROM orders WHERE id=$1 AND client_id=$2`,
      [orderId, clientId]
    );
    if (orderResult.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found for this client" });
    }
    const order = orderResult.rows[0];

    // Έλεγχος status
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    }

    // Επιστροφή stock και ενεργοποίηση προϊόντων
    const orderItemsResult = await connection.query(
      `SELECT * FROM order_items WHERE order_id=$1`,
      [orderId]
    );

    for (const item of orderItemsResult.rows) {
      await connection.query(
        `UPDATE products SET stock=stock+$1, is_active=true WHERE id=$2`,
        [item.quantity, item.product_id]
      );
    }

    // Αλλαγή status σε cancelled
    await connection.query(`UPDATE orders SET status='cancelled' WHERE id=$1`, [
      orderId,
    ]);

    await connection.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully and stock returned",
    });
  } catch (error) {
    await connection.query("ROLLBACK");
    console.error("Order cancel failed: ", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
};
