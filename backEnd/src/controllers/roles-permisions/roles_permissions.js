import { testDb } from "../../Configs/dbConfig.js";
import logger from "../../logger/winston.js";

export const registerUser = async (req, res) => { }





//this function creates a role example of current roles we do have in the church
//'Chairperson',
//'Assistant_Chairperson',
//'Organizing_Secretary',
//'Treasurer',
//'Secretary',
//'Assistance_Secretary',
//'Liturgist',
//'Assistance_Liturgist'

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

