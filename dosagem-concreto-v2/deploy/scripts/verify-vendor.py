from argon2 import PasswordHasher

hashed = PasswordHasher().hash("local-vendor-probe-only")
assert PasswordHasher().verify(hashed, "local-vendor-probe-only")
print("Argon2id runtime: OK")
