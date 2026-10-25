/**
 * Factory de middleware para controle de acesso por role.
 *
 * Uso: router.delete('/:id', authenticate, requireRole('ADMIN'), controller.delete)
 *
 * @param  {...string} roles  Roles permitidas
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acesso negado. Perfis permitidos: ${roles.join(', ')}.`,
      });
    }

    next();
  };
}

module.exports = { requireRole };
