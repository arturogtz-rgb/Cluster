# Test Credentials

## Admin Account
- **Username:** admin
- **Password:** admin123
- **Login URL:** /admin
- **Note:** In production, password should be changed after first deploy. Set ADMIN_INITIAL_PASSWORD env var in .env.production before first run.

## API Authentication
- POST /api/auth/login with {"username": "admin", "password": "admin123"}
- Returns JWT token in response body
- Use as: Authorization: Bearer <token>
