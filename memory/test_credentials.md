# Test Credentials

## Admin Account
- **Username:** admin
- **Password:** admin123
- **Login URL:** /admin
- **Login endpoint:** POST /api/auth/login with {"username":"admin","password":"admin123"}

## PST Test Account
- **Email:** test@empresa.com
- **Password:** password123
- **Login URL:** /pst/login
- **Login endpoint:** POST /api/pst/login with {"email":"test@empresa.com","password":"password123"}
- **Empresa:** Aventuras Test (estado: aprobado)
- **Note:** This account has an approved empresa, so wizard will redirect to dashboard.

## Registration
- **URL:** /registro
- **Creates:** New PST account, then redirects to /pst/wizard

## Discount Code (test)
- Code: GRATIS2026 (100% discount, 10 uses max)
