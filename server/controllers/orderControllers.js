import pool from "./../config/pool.js";
import {
  canPerformAction,
  getNextStatus,
} from "./../utils/orderTransitions.js";

/**Roles:
 *  admin:watch all, cancel all
 * user:watch his seller_id
 * client:watch his client_id
 *
 */

//get all orders

export const getOrders = async (req, res) => {
  try {
    const { role, id: userUId } = req.user;
    console.log("active-role: ", role);

    const { status } = req.query;
    console.log("role: ", req.user.role);

    let query = `SELECT * FROM orders`;
    const values = [];
    const where = [];

    if (role === "client") {
      values.push(userUId);
      where.push(`client_id=$${values.length}`);
    }
    if (role === "user") {
      values.push(userUId);
      where.push(`seller_id=$${values.length}`);
    }
    if (status) {
      values.push(status);
      where.push(`status=$${values.length}`);
    }

    if (where.length) {
      query += " WHERE " + where.join(" AND "); // <-- Διορθώθηκε
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      count: result.rowCount,
      orders: result.rows,
    });
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//get order by id

export const gerOrderById = async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    const { id: orderId } = req.params;

    let query = `SELECT * FROM orders WHERE id=$1`;
    const values = [orderId];
    if (role === "client") {
      query + ` AND client_id=$2`;
      values.push(userId);
    }
    if (role === "user") {
      query += ` AND seller_id=$2`;
      values.push(userId);
    }
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    res.json({
      success: true,
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const createOrder = async (req, res) => {
  const { id: userId, role } = req.user;
  const { clientId, items } = req.body;
  console.log("sellerId: ", userId);

  console.log("role", role);
  console.log("client: ", clientId);

  console.log("items:", items);

  //client
  const finalClientId = role === "client" ? userId : clientId;

  //seller
  const sellerId = role === "user" ? userId : null;

  if (!finalClientId) {
    return res
      .status(400)
      .json({ success: false, message: "Client is required" });
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, messageL: "No items provided" });
  }

  const connection = await pool.connect();

  try {
    await connection.query("BEGIN");
    let total = 0;
    for (const item of items) {
      const { rows, rowCount } = await connection.query(
        `SELECT price,stock FROM products WHERE id=$1 AND is_active=true FOR UPDATE`,
        [item.product_id]
      );
      if (!rowCount) {
        throw new Error(`Product ${item.product_id} not available`);
      }
      if (item.quantity > rows[0].stock) {
        throw new Error("Not enough stock ");
      }
      total += rows[0].price * item.quantity;
    }
    const orderResult = await connection.query(
      `INSERT INTO orders(client_id,seller_id,total) VALUES($1,$2,$3) RETURNING*`,
      [finalClientId, sellerId, total]
    );
    const order = orderResult.rows[0];
    for (const item of items) {
      const { rows } = await connection.query(
        `SELECT price FROM products WHERE id=$1`,
        [item.product_id]
      );
      await connection.query(
        `INSERT INTO order_items (order_id,product_id,quantity,price) VALUES($1,$2,$3,$4) RETURNING*`,
        [order.id, item.product_id, item.quantity, rows[0].price]
      );
      await connection.query(`UPDATE products SET stock=stock-$1 WHERE id=$2`, [
        item.quantity,
        item.product_id,
      ]);
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
    console.error("Create order failed:", error);

    res.status(400).json({
      message: error.message,
    });
  } finally {
    connection.release();
  }
};

export const cancelOrder = async (req, res) => {
  const { id: userId, role } = req.user;
  const { id: orderId } = req.params;
  //console.log(userId, role, orderId);

  const connection = await pool.connect();
  try {
    await connection.query("BEGIN");
    const orderResult = await connection.query(
      `SELECT * FROM orders WHERE id=$1`,
      [orderId]
    );
    if (orderResult.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    const order = orderResult.rows[0];

    if (!canPerformAction(order.status, "cancel", role)) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden or cannot cancel" });
    }

    //ownership check

    if (role === "client" && order.cliend_id !== userId) {
      await connection.query("ROLLBACK");
      return res.status(403).json({ success: false, message: "forbidden" });
    }
    if (role === "user" && order.seller_id !== userId) {
      await connection.query("ROLLBACK");
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (order.status !== "pending") {
      await connection.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be cancelled",
      });
    }
    //return stock
    const itemsResult = await connection.query(
      `SELECT * FROM order_items WHERE id=$1`,
      [orderId]
    );
    for (const item of itemsResult.rows) {
      await connection.query(
        `UPDATE products SET stock=stock +$1 WHERE id=$2`,
        [item.quantity, item.product_id]
      );
    }
    await connection.query(`UPDATE orders SET status='cancelled' WHERE id=$1`, [
      orderId,
    ]);
    await connection.query("COMMIT");
    res
      .status(200)
      .json({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    await connection.query("ROLLBACK");
    console.error("Cancel order error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  } finally {
    connection.release();
  }
};

export const editOrder = async (req, res) => {
  const { id: userId, role } = req.user;
  const { id: orderId } = req.params;

  const { items } = req.body; // [{ product_id, quantity }]
  console.log(role);

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No items provided" });
  }

  const connection = await pool.connect();

  try {
    await connection.query("BEGIN");

    // Φόρτωση order με κλείδωμα για update
    const orderResult = await connection.query(
      `SELECT * FROM orders WHERE id=$1 FOR UPDATE`,
      [orderId]
    );

    if (orderResult.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const order = orderResult.rows[0];

    if (!canPerformAction(order.status, "edit", role)) {
      return res
        .status(403)
        .json({ success: false, message: "Forbidden or order not editable" });
    }

    // Έλεγχος status
    if (order.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be edited",
      });
    }

    // Έλεγχος ownership για client και user
    if (role === "client" && order.client_id !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (role === "user" && order.seller_id !== userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    // Φόρτωση υπάρχοντων items
    const existingItemsResult = await connection.query(
      `SELECT * FROM order_items WHERE order_id=$1 FOR UPDATE`,
      [orderId]
    );
    const existingItems = existingItemsResult.rows;

    // Επιστροφή stock των παλιών προϊόντων
    for (const item of existingItems) {
      await connection.query(
        `UPDATE products SET stock = stock + $1 WHERE id=$2`,
        [item.quantity, item.product_id]
      );
    }

    // Διαγραφή παλιών order_items
    await connection.query(`DELETE FROM order_items WHERE order_id=$1`, [
      orderId,
    ]);

    // Υπολογισμός νέου total και ενημέρωση stock
    let total = 0;
    for (const item of items) {
      const productResult = await connection.query(
        `SELECT price, stock FROM products WHERE id=$1 FOR UPDATE`,
        [item.product_id]
      );

      if (productResult.rowCount === 0) {
        throw new Error(`Product ${item.product_id} not found`);
      }

      const product = productResult.rows[0];
      const quantity = parseInt(item.quantity);

      if (quantity > product.stock) {
        throw new Error(`Not enough stock for product ${item.product_id}`);
      }

      total += product.price * quantity;

      // Εισαγωγή νέου order_item
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.product_id, quantity, product.price]
      );

      // Μείωση stock
      await connection.query(
        `UPDATE products SET stock = stock - $1 WHERE id=$2`,
        [quantity, item.product_id]
      );
    }

    // Ενημέρωση συνολικού ποσού
    await connection.query(`UPDATE orders SET total=$1 WHERE id=$2`, [
      total,
      orderId,
    ]);

    await connection.query("COMMIT");

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      orderId,
      total,
    });
  } catch (error) {
    await connection.query("ROLLBACK");
    console.error("Edit order failed:", error);
    res.status(400).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

export const completeOrder = async (req, res) => {
  const { role } = req.user;
  const { id: orderId } = req.params;

  if (role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Only admin can complete orders" });
  }

  const connection = await pool.connect();

  try {
    await connection.query("BEGIN");

    const orderResult = await connection.query(
      `SELECT * FROM orders WHERE id=$1 FOR UPDATE`,
      [orderId]
    );

    if (orderResult.rowCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const order = orderResult.rows[0];

    if (!canPerformAction(order.status, "complete", role)) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot complete this order" });
    }

    await connection.query(`UPDATE orders SET status=$1 WHERE id=$2`, [
      getNextStatus(order.status, "complete"),
      orderId,
    ]);

    await connection.query("COMMIT");

    res
      .status(200)
      .json({ success: true, message: "Order completed successfully" });
  } catch (error) {
    await connection.query("ROLLBACK");
    console.error("Complete order failed:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};
