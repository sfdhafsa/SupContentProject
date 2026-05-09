import { validate as isUUID } from 'uuid';

export const validateUUIDParam = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!value || !isUUID(value)) {
      return res.status(400).json({
        message: `Paramètre invalide: ${paramName} doit être un UUID valide.`,
      });
    }

    next();
  };
};