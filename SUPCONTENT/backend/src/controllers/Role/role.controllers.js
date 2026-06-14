import { validationResult } from 'express-validator';
import { RoleModel } from '../../models/role.model.js';

/**
 *  GET all roles
 * GET /api/roles
 */
export const getAllRoles = async (req, res, next) => {
  try {
    const roles = await RoleModel.findAll();

    return res.json({
      roles
    });

  } catch (err) {
    next(err);
  }
};

/**
 * CREATE role
 * POST /api/roles
 * (admin only normalement)
 */
export const createRole = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    // check if role exists
    const existing = await RoleModel.findByName(name);

    if (existing) {
      return res.status(409).json({
        message: 'Ce rôle existe déjà.'
      });
    }

    const role = await RoleModel.create(name);

    return res.status(201).json({
      message: 'Rôle créé avec succès.',
      role
    });

  } catch (err) {
    next(err);
  }
};

/**
 *  DELETE role
 * DELETE /api/roles/:id
 */
export const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;

    const role = await RoleModel.findById(id);

    if (!role) {
      return res.status(404).json({
        message: 'Rôle introuvable.'
      });
    }

    await RoleModel.deleteById(id);

    return res.json({
      message: 'Rôle supprimé avec succès.'
    });

  } catch (err) {
    next(err);
  }
};

/**
 * ASSIGN role to user
 * POST /api/roles/assign
 */
export const assignRoleToUser = async (req, res, next) => {
  try {
    const { userId, roleName } = req.body;

    const role = await RoleModel.findByName(roleName);

    if (!role) {
      return res.status(404).json({
        message: 'Rôle introuvable.'
      });
    }

    await RoleModel.assignRoleToUser(userId, role.id);

    return res.json({
      message: 'Rôle attribué avec succès.'
    });

  } catch (err) {
    next(err);
  }
};

/**
 * REMOVE role from user
 * DELETE /api/roles/remove
 */
export const removeRoleFromUser = async (req, res, next) => {
  try {
    const { userId, roleName } = req.body;

    const role = await RoleModel.findByName(roleName);

    if (!role) {
      return res.status(404).json({
        message: 'Rôle introuvable.'
      });
    }

    await RoleModel.removeRoleFromUser(userId, role.id);

    return res.json({
      message: 'Rôle retiré avec succès.'
    });

  } catch (err) {
    next(err);
  }
};