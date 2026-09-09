# Test Credentials

## Admin Account
- **Username:** admin
- **Password:** admin123
- **Login URL:** /admin
- **Login endpoint:** POST /api/auth/login with {"username":"admin","password":"admin123"}

## PST Test Account
- **Email:** test@empresa.com
- **Password:** password123
- **Login endpoint:** POST /api/pst/login with {"email":"test@empresa.com","password":"password123"}
- **Empresa:** Aventuras Test (estado: aprobado)

## API Authentication
- Admin: POST /api/auth/login → token in response → Authorization: Bearer <token>
- PST: POST /api/pst/login → token in response → Authorization: Bearer <token>
- Admin token has role: "admin", PST token has role: "pst"

## Discount Code (test)
- Code: GRATIS2026 (100% discount, 10 uses max)
