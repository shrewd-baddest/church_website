

export const getMemberPermissions = async (db, memberId, jumuiaId) => {
  return db.query(`
    SELECT p.action, p.resource
    FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.permission_id
    JOIN member_roles mr ON mr.role_id = rp.role_id
    WHERE mr.member_id = $1 AND mr.jumuia_id = $2
  `, [memberId, jumuiaId]);
};
