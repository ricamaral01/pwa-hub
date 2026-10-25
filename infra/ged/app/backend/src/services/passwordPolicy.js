function validatePassword(password, user = {}, options = {}) {
  const errors = [];
  if (!password || password.length < 8) errors.push('Mínimo de 8 caracteres.');
  if (!/[A-Z]/.test(password || '')) errors.push('Inclua pelo menos uma letra maiúscula.');
  if (!/[a-z]/.test(password || '')) errors.push('Inclua pelo menos uma letra minúscula.');
  if (!/[0-9]/.test(password || '')) errors.push('Inclua pelo menos um número.');
  if (!/[^A-Za-z0-9]/.test(password || '')) errors.push('Inclua pelo menos um caractere especial.');

  const normalized = String(password || '').toLowerCase();
  if (user.username && normalized === String(user.username).toLowerCase()) {
    errors.push('A senha não pode ser igual ao nome de usuário.');
  }
  if (user.email && normalized === String(user.email).toLowerCase()) {
    errors.push('A senha não pode ser igual ao e-mail.');
  }
  if (options.sameAsCurrent) {
    errors.push('A nova senha não pode ser igual à senha temporária.');
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validatePassword };
