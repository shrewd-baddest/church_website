import bcrypt from "bcrypt";
import { testDb } from "../../Configs/dbConfig.js";
import logger from "../../logger/winston.js";



//route to register a user with roles and permissions, this is for testing purposes only, in production we will have an admin interface to manage users, roles and permissions
export const registerUser = async (req, res) => {
  let {
    registration_number,   // e.g. "PA106/G/20000/23"
    jumuiya_name,          // human-readable name
    first_name,
    last_name,
    gender,
    email,
    phone,
    year_of_study,
    course,
    password,
    role_names             // array of roles, e.g. ["Member", "Secretary"]
  } = req.body;

  // Ensure all required fields are present
  if (!registration_number || !jumuiya_name || !first_name || !last_name || !gender || !email || !phone || !year_of_study || !course || !password) {
    return res.status(403).json({ error: "All fields are required" });
  }

  try {
    // 1. Normalize registration number to uppercase
    registration_number = registration_number.toUpperCase();

    // 2. Validate registration number format (strict uppercase)
    const regPattern = /^[A-Z]{2,3}[0-9]{2,3}\/[A-Z]{1,2}\/[0-9]{4,5}\/[0-9]{2}$/;
    if (!regPattern.test(registration_number)) {
      return res.status(400).json({ error: `Invalid registration number format: ${registration_number}` });
    }

    // 3. Check if member already exists (case-insensitive)
    const existingMember = await testDb.query(
      'SELECT member_id FROM members WHERE LOWER(member_id) = LOWER($1) OR LOWER(email) = LOWER($2)',
      [registration_number, email]
    );
    if (existingMember.rows.length > 0) {
      return res.status(409).json({ error: 'Member with email or registration number already registered' });
    }

    // 4. Hash password
    const saltRounds = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 5. Resolve jumuiya_name → group_id
    const subgroupResult = await testDb.query(
      'SELECT group_id FROM sub_groups WHERE name = $1',
      [jumuiya_name]
    );
    if (subgroupResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid jumuiya_name' });
    }
    const jumuiya_id = subgroupResult.rows[0].group_id;

    // 6. Insert into members
    const insertMemberQuery = `
      INSERT INTO members (
        member_id, jumuiya_id, first_name, last_name, gender, email, phone,
        year_of_study, course, password, join_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE)
      RETURNING member_id;
    `;
    const memberValues = [
      registration_number,
      jumuiya_id,
      first_name,
      last_name,
      gender,
      email.toLowerCase(),
      phone,
      year_of_study,
      course,
      hashedPassword,
    ];
    const memberResult = await testDb.query(insertMemberQuery, memberValues);
    const newMemberId = memberResult.rows[0].member_id;

    // 7. Assign roles (default to "Member" if none provided)
    const rolesToAssign = role_names && role_names.length > 0 ? role_names : ["Member"];
    const uniqueRoles = [...new Set(rolesToAssign)];

    for (const roleName of uniqueRoles) {
      const roleResult = await testDb.query(
        'SELECT role_id FROM roles WHERE role_name = $1',
        [roleName]
      );
      if (roleResult.rows.length === 0) {
        console.warn(`Role not found: ${roleName}`);
        continue; // skip invalid roles
      }
      const roleId = roleResult.rows[0].role_id;

      await testDb.query(
        'INSERT INTO member_roles (member_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [newMemberId, roleId]
      );
    }

    // 8. Success response
    res.status(201).json({
      message: 'Member registered successfully with roles',
      member_id: newMemberId,
      roles: uniqueRoles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

//this function creates a role example of current roles we do have in the church
//'Chairperson',
//'Assistant_Chairperson',
//'Organizing_Secretary',
//'Treasurer',
//'Secretary',
//'Assistance_Secretary',
//'Liturgist',
//'Assistance_Liturgist'
//member
export const registerRoles = async (req, res) => {
  try {
    if (!req.user || !req.user.username) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const createdBy = req.user.username;
    const { role_name, description } = req.body;

    const result = await testDb.query(
      `INSERT INTO roles (role_name, description, created_by, status) 
       VALUES ($1, $2, $3, 'active') 
       RETURNING role_id, role_name, description, created_by, created_at, status`,
      [role_name.trim(), description.trim(), createdBy]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

//this function creates permissions for example of current roles we do have in the church
// Chairperson
//this is for managing members , example the chaireperson can have permissions
//  of creating, updating, deleting and viewing members while the assistant chairperson can only have permission of viewing members and so forth for other roles
// members:create,  members:update,  members:delete,  members:view 
// roles:create, roles:assign, roles:view
// permissions:create, permissions:assign
// events:create, events:update, events:delete, events:view
// attendance:record
// contributions:view
// notifications:create, notifications:update, notifications:delete, notifications:view
// uploads:create, uploads:view, uploads:delete, notification_uploads:link
// audit:view

// Assistant Chairperson
// members:view, members:update
// roles:view
// events:create, events:update, events:view
// attendance:record
// contributions:view
// notifications:create, notifications:view
// uploads:view

// Secretary
// members:create, members:update, members:view
// events:create, events:update, events:view
// notifications:create, notifications:update, notifications:view
// uploads:create, uploads:view, notification_uploads:link

// Assistant Secretary
// members:view
// events:view
// notifications:view
// uploads:view

// Organizing Secretary
// events:create, events:update, events:view
// attendance:record
// notifications:create, notifications:view

// Treasurer
// contributions:create, contributions:update, contributions:view, contributions:delete
// events:view
// audit:view (restricted to financial logs if you want finer granularity)

// Liturgist
// events:view
// notifications:view
// uploads:view (for liturgy materials)

// Assistant Liturgist
// events:view
// notifications:view

// Member
// events:view
// notifications:view
export const registerPermissions = async (req, res) => {
  try {
    if (!req.user || !req.user.username) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const createdBy = req.user.username;
    const { resource, action, description } = req.body;

    const result = await testDb.query(
      `INSERT INTO permissions (resource, action, description, created_by, status) 
       VALUES ($1, $2, $3, $4, 'active') 
       RETURNING permission_id, resource, action, description, created_by, created_at, status`,
      [resource.trim(), action.trim(), description.trim(), createdBy]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

//this function assigns permissions to a role for example the role of chairperson can have permissions
//  of managing events, managing members and viewing reports while the role of liturgist can only have permission of managing events
export const assignPermissionsToRole = async (req, res) => {
  try {
    const { role_id, permission_id } = req.body;

    await client.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [role_id, permission_id]
    );

    res.status(201).json({ message: "Permission assigned to role successfully" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRolesAndPermissions = async (req, res) => {
  try {
    // Run both queries concurrently
    const [rolesResult, permissionsResult] = await Promise.all([
      testDb.query(
        `SELECT role_id, role_name, description, created_by, created_at, status 
         FROM roles ORDER BY role_name ASC`
      ),
      testDb.query(
        `SELECT permission_id, resource, action, description, created_by, created_at, status 
         FROM permissions ORDER BY resource ASC, action ASC`
      )
    ]);

    res.status(200).json({
      roles: rolesResult.rows,
      permissions: permissionsResult.rows,
    });
  } catch (err) {
    logger.error(`Error fetching roles and permissions: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPermissionsByRole = async (req, res) => {
  try {
    const { role_id } = req.body;
    const result = await testDb.query(
      `SELECT p.permission_id, p.resource, p.action, p.description 
       FROM permissions p   
        JOIN role_permissions rp ON p.permission_id = rp.permission_id
        WHERE rp.role_id = $1 AND p.status = 'active'`,

      [role_id]
    );
    res.status(200).json(result.rows);

  } catch (err) {
    logger.error(`Error fetching permissions for role ${req.params.role_id}: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
  }
};

// this function list the permission, roles of a person based on the unique regestration number
export const getUserRolesAndPermissions = async (req, res) => {
  try {
    const { registration_number } = req.body;

    if (!registration_number) {
      return res.status(400).json({ error: "registration_number is required" });
    }


    const regPattern = /^[A-Z]{2,3}[0-9]{2,3}\/[A-Za-z]{1,2}\/[0-9]{4,5}\/[0-9]{2}$/;
    if (!regPattern.test(registration_number)) {
      return res.status(400).json({ error: `Invalid registration number format: ${registration_number}` });
    }


    const result = await testDb.query(
      `SELECT r.role_name, p.resource, p.action
        FROM members m  
        JOIN member_roles mr ON m.member_id = mr.member_id
        JOIN roles r ON mr.role_id = r.role_id
        JOIN role_permissions rp ON r.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id
        WHERE m.member_id = $1 AND r.status = 'active' AND p.status = 'active'`,
      [registration_number]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    logger.error(`Error fetching roles and permissions for user ${req.params.registration_number}: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
  }
};

//function to selet every one from the members table and list their roles and permissions, this is for testing purposes only, in production we will have an admin interface to manage users, roles and permissions
export  const listAllUsersRolesPermissions = async (req, res) => {
  try {
    const result = await testDb.query(  
      `SELECT *
        FROM members m
        JOIN member_roles mr ON m.member_id = mr.member_id
        JOIN roles r ON mr.role_id = r.role_id
        JOIN role_permissions rp ON r.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.permission_id  
        WHERE r.status = 'active' AND p.status = 'active'
        ORDER BY m.member_id`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    logger.error(`Error fetching all users with roles and permissions: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
  }
};

// function to get only the member tables column for all members
export const listAllMembers = async (req, res) => {
  try {
    const result = await testDb.query(
      `SELECT *
        FROM members ORDER BY member_id`  
    );
    res.status(200).json(result.rows);
  }
    catch (err) {
    logger.error(`Error fetching all members: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
  } 
};

// a function to delete all memebr fom the database keeping in mind we have foreign key constraints with other tables, this is for testing purposes only, in production we will have an admin interface to manage users, roles and permissions
export const deleteAllMembers = async (req, res) => {
  try {
    await testDb.query('DELETE FROM member_roles');
    await testDb.query('DELETE FROM members');
    res.status(200).json({ message: "All members deleted successfully" });
  } catch (err) {
    logger.error(`Error deleting all members: ${err.message}`, { stack: err.stack });
    res.status(500).json({ error: "Internal server error" });
}
};
