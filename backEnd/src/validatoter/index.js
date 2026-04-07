import { body } from "express-validator";

export const registerRoleValidator = () => {
  return [
    body("role_name")
      .trim()
      .notEmpty()
      .withMessage("Role name is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
  ];
};

export const registerPermissionValidator = () => {
  return [
    body("resource")
      .trim()
      .notEmpty()
      .withMessage("Resource is required"),
    body("action")
      .trim()
      .notEmpty()
      .withMessage("Action is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
  ];
};

export const assignRolePermissionValidator = () => {
  return [
    body("role_id")
      .trim()
      .notEmpty()
      .withMessage("Role ID is required"),
    body("permission_id")
      .trim()
      .notEmpty()
      .withMessage("Permission ID is required"),
  ];
};