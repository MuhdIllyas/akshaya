import express from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// Middleware to verify token and role
const authMiddleware = (allowedRoles) => async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.log("Auth middleware: No token provided");
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query("SELECT role, centre_id FROM staff WHERE id = $1", [decoded.id]);
    if (result.rows.length === 0) {
      console.log(`Auth middleware: User not found for ID ${decoded.id}`);
      return res.status(401).json({ error: "User not found" });
    }

    const userRole = result.rows[0].role;
    if (!allowedRoles.includes(userRole)) {
      console.log(`Auth middleware: Role ${userRole} not allowed. Required: ${allowedRoles}`);
      return res.status(403).json({ error: "Unauthorized access" });
    }

    req.user = decoded;
    req.user.centre_id = result.rows[0].centre_id;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Add new staff member
router.post("/add", authMiddleware(["admin", "superadmin"]), async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      username,
      name,
      role,
      department,
      email,
      phone,
      status,
      joinDate,
      employeeId,
      employmentType,
      reportsTo,
      salary,
      dateOfBirth,
      gender,
      emergencyContact,
      emergencyRelationship,
      centre_id,
      photo,
      password,
      permissions,
    } = req.body;

    if (!username || !name || !role || !email || !password) {
      return res.status(400).json({ error: "Username, name, role, email, and password are required" });
    }

    const centreId = req.user.role === "admin" ? req.user.centre_id : centre_id;
    if (!centreId && role !== "superadmin") {
      console.log("Add staff: Centre ID is required for non-superadmin roles");
      return res.status(400).json({ error: "Centre ID is required for non-superadmin roles" });
    }

    // Validate centre exists if provided
    if (centreId) {
      const centreCheck = await client.query("SELECT id FROM centres WHERE id = $1", [centreId]);
      if (centreCheck.rows.length === 0) {
        console.log(`Add staff: Invalid centre ID ${centreId}`);
        return res.status(400).json({ error: "Invalid centre ID" });
      }
    }

    // Check for duplicate username or email
    const existingUser = await client.query(
      "SELECT id FROM staff WHERE username = $1 OR email = $2",
      [username, email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    if (!hashedPassword) {
      console.error("Error: Failed to hash password");
      return res.status(500).json({ error: "Failed to generate password" });
    }

    await client.query("BEGIN");

    const result = await client.query(
      `
      INSERT INTO staff (
        username, name, role, department, email, phone, status, join_date, photo,
        employee_id, employment_type, reports_to, salary, dob, gender,
        emergency_contact, emergency_relationship, centre_id, created_at, password,
        permissions
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15,
        $16, $17, $18, NOW(), $19, $20
      ) RETURNING id, username, name, role, department, email, phone, status,
        join_date AS "joinDate", photo, employee_id AS "employeeId",
        employment_type AS "employmentType", reports_to AS "reportsTo",
        salary, dob, gender, emergency_contact AS "emergencyContact",
        emergency_relationship AS "emergencyRelationship", centre_id AS "centreId",
        created_at
      `,
      [
        username,
        name,
        role,
        department || null,
        email,
        phone || null,
        status || "Active",
        joinDate || new Date().toISOString(),
        photo || null,
        employeeId || null,
        employmentType || null,
        reportsTo || null,
        salary || null,
        dateOfBirth || null,
        gender || null,
        emergencyContact || null,
        emergencyRelationship || null,
        centreId || null,
        hashedPassword,
        permissions || null,
      ]
    );

    const newStaff = result.rows[0];

    // Log staff creation activity
    await client.query(
      `
      INSERT INTO activity_log (staff_id, action, timestamp, details)
      VALUES ($1, $2, $3, $4)
      `,
      [
        req.user.id,
        "staff_created",
        new Date(),
        `Created staff: ${newStaff.username} (ID: ${newStaff.id})`,
      ]
    );

    if (role === "admin") {
      await client.query("UPDATE centres SET admin_id = $1 WHERE id = $2", [newStaff.id, centreId]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Staff created successfully",
      staff: newStaff,
      password,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error adding staff:", err.message);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Username or email already exists" });
    }
    if (err.code === "23502") {
      return res.status(400).json({ error: `Missing required field: ${err.column}` });
    }
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// Get all staff (for reportsTo dropdown and other uses)
router.get("/all", authMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const centreId = req.user.role === "admin" ? req.user.centre_id : req.query.centre_id;
    const roleFilter = req.query.role ? req.query.role.split(",") : null;
    let query = `
      SELECT 
        id, username, name, role, department, email, phone, status,
        join_date AS "joinDate", photo, employee_id AS "employeeId",
        employment_type AS "employmentType", reports_to AS "reportsTo",
        salary, dob, gender, emergency_contact AS "emergencyContact",
        emergency_relationship AS "emergencyRelationship", centre_id AS "centreId",
        created_at,
        COALESCE(
          (
            SELECT json_agg(activity)
            FROM (
              SELECT 
                json_build_object(
                  'action', al.action,
                  'timestamp', al.timestamp,
                  'details', al.details
                ) AS activity
              FROM activity_log al
              WHERE al.staff_id = s.id
              ORDER BY al.timestamp DESC
              LIMIT 5
            ) sub
          ),
          '[]'::json
        ) AS recent_activity
      FROM staff s
    `;
    const params = [];
    let conditions = [];

    if (centreId) {
      conditions.push(`centre_id = $${params.length + 1}`);
      params.push(Number(centreId));
    }
    if (roleFilter) {
      conditions.push(`role = ANY($${params.length + 1})`);
      params.push(roleFilter);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += " ORDER BY join_date DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching staff:", err.message);
    res.status(500).json({ error: "Failed to fetch staff data" });
  }
});

// Get staff by ID
router.get("/:id", authMiddleware(["admin", "superadmin"]), async (req, res) => {
  const client = await pool.connect();
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const staffResult = await client.query(
      `
      SELECT 
        id, username, name, role, department, email, phone, status,
        join_date AS "joinDate", photo, employee_id AS "employeeId",
        employment_type AS "employmentType", reports_to AS "reportsTo",
        salary, dob, gender, emergency_contact AS "emergencyContact",
        emergency_relationship AS "emergencyRelationship", centre_id AS "centreId",
        created_at
      FROM staff
      WHERE id = $1
      `,
      [id]
    );

    if (staffResult.rows.length === 0) {
      return res.status(404).json({ error: "Staff not found" });
    }

    if (req.user.role === "admin" && req.user.centre_id !== staffResult.rows[0].centreId) {
      return res.status(403).json({ error: "Unauthorized to access this staff member" });
    }

    const activityResult = await client.query(
      `
      SELECT action, timestamp, details
      FROM activity_log
      WHERE staff_id = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3
      `,
      [id, limit, offset]
    );

    const staff = staffResult.rows[0];
    staff.recentActivity = activityResult.rows;

    res.json(staff);
  } catch (err) {
    console.error("Error fetching staff by ID:", err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// Delete staff by ID
router.delete("/:id", authMiddleware(["admin", "superadmin"]), async (req, res) => {
  const client = await pool.connect();
  const { id } = req.params;

  try {
    await client.query("BEGIN");

    const staffResult = await client.query("SELECT centre_id, username FROM staff WHERE id = $1", [id]);
    if (staffResult.rows.length === 0) {
      return res.status(404).json({ error: "Staff not found" });
    }

    if (req.user.role === "admin" && req.user.centre_id !== staffResult.rows[0].centre_id) {
      return res.status(403).json({ error: "Unauthorized to delete this staff member" });
    }

    const deletedStaff = staffResult.rows[0];
    await client.query(
      `
      INSERT INTO activity_log (staff_id, action, timestamp, details)
      VALUES ($1, $2, $3, $4)
      `,
      [req.user.id, "staff_deleted", new Date(), `Deleted staff: ${deletedStaff.username} (ID: ${id})`]
    );

    await client.query("DELETE FROM staff WHERE id = $1", [id]);
    await client.query("UPDATE centres SET admin_id = NULL WHERE admin_id = $1", [id]);

    await client.query("COMMIT");
    res.json({ message: "Staff deleted successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error deleting staff:", err.message);
    res.status(500).json({ error: "Failed to delete staff" });
  } finally {
    client.release();
  }
});

// Update staff
router.put("/:id", authMiddleware(["admin", "superadmin"]), async (req, res) => {
  const { id } = req.params;
  const {
    username,
    name,
    role,
    department,
    email,
    phone,
    status,
    joinDate,
    photo,
    employeeId,
    employmentType,
    reportsTo,
    salary,
    dateOfBirth,
    gender,
    emergencyContact,
    emergencyRelationship,
    centre_id,
    permissions,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const staffResult = await client.query("SELECT centre_id, username FROM staff WHERE id = $1", [id]);
    if (staffResult.rows.length === 0) {
      return res.status(404).json({ error: "Staff not found" });
    }

    const centreId = req.user.role === "admin" ? req.user.centre_id : centre_id;
    if (!centreId && role !== "superadmin") {
      console.log("Update staff: Centre ID is required for non-superadmin roles");
      return res.status(400).json({ error: "Centre ID is required for non-superadmin roles" });
    }

    // Validate centre exists if provided
    if (centreId) {
      const centreCheck = await client.query("SELECT id FROM centres WHERE id = $1", [centreId]);
      if (centreCheck.rows.length === 0) {
        console.log(`Update staff: Invalid centre ID ${centreId}`);
        return res.status(400).json({ error: "Invalid centre ID" });
      }
    }

    const result = await client.query(
      `
      UPDATE staff
      SET username = $1,
          name = $2,
          role = $3,
          department = $4,
          email = $5,
          phone = $6,
          status = $7,
          join_date = $8,
          photo = $9,
          employee_id = $10,
          employment_type = $11,
          reports_to = $12,
          salary = $13,
          dob = $14,
          gender = $15,
          emergency_contact = $16,
          emergency_relationship = $17,
          centre_id = $18,
          permissions = $19
      WHERE id = $20
      RETURNING id, username, name, role, department, email, phone, status,
        join_date AS "joinDate", photo, employee_id AS "employeeId",
        employment_type AS "employmentType", reports_to AS "reportsTo",
        salary, dob, gender, emergency_contact AS "emergencyContact",
        emergency_relationship AS "emergencyRelationship", centre_id AS "centreId",
        created_at
      `,
      [
        username,
        name,
        role,
        department || null,
        email,
        phone || null,
        status || "Active",
        joinDate || new Date().toISOString(),
        photo || null,
        employeeId || null,
        employmentType || null,
        reportsTo || null,
        salary || null,
        dateOfBirth || null,
        gender || null,
        emergencyContact || null,
        emergencyRelationship || null,
        centreId || null,
        permissions || null,
        id,
      ]
    );

    const updatedStaff = result.rows[0];

    await client.query(
      `
      INSERT INTO activity_log (staff_id, action, timestamp, details)
      VALUES ($1, $2, $3, $4)
      `,
      [
        req.user.id,
        "staff_updated",
        new Date(),
        `Updated staff: ${username} (ID: ${id})`,
      ]
    );

    if (role === "admin") {
      await client.query("UPDATE centres SET admin_id = $1 WHERE id = $2", [id, centreId]);
    } else {
      await client.query("UPDATE centres SET admin_id = NULL WHERE admin_id = $1", [id]);
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Staff updated successfully", staff: updatedStaff });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Update failed:", err.message);
    if (err.code === "23505") {
      return res.status(400).json({ error: "Username or email already exists" });
    }
    res.status(500).json({ error: "Failed to update staff" });
  } finally {
    client.release();
  }
});

// Change password
router.post("/users/change-password", authMiddleware(["admin", "superadmin", "staff", "supervisor"]), async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const client = await pool.connect();

  try {
    const userResult = await client.query("SELECT password FROM staff WHERE username = $1", [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await client.query("UPDATE staff SET password = $1 WHERE username = $2", [hashedNew, username]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err.message);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

export default router;