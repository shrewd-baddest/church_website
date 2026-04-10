import { testDb } from "../Configs/dbConfig.js";
import { getMemberPermissions } from "../repository/repository.js";

export const authorize = (action, resource) => {
  return async (req, res, next) => {
    const { member_id: memberId, jumuiya_id: jumuiyaId } = req.user;

    const permissions = await getMemberPermissions(testDb, memberId, jumuiyaId);

    if (!permissions.length) {
      return res
        .status(403)
        .json({ message: "Access denied: no role in this jumuia" });
    }

    const isAuthorized = permissions.some(
      (perm) => perm.action === action && perm.resource === resource,
    );

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ message: "Access denied: no permission for this resource" });
    }

    next();
  };
};
