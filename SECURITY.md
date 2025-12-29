# Security Notice

## ⚠️ Credential Exposure Incident

**Date**: 2025-12-29

### Issue
The file `frontend/.env.local` was previously committed to the repository containing sensitive credentials:
- Database connection string with real password
- Better Auth secret key

### Remediation Completed
✅ Removed `frontend/.env.local` from git tracking
✅ Updated `frontend/.env.local.example` with safe placeholder values
✅ Verified `.gitignore` is properly configured to ignore `.env*` files

### Required Actions

**CRITICAL**: If this repository was ever pushed to a remote (GitHub, GitLab, etc.), the following secrets **MUST be rotated immediately**:

1. **Database Password**: The Neon PostgreSQL password (`npg_tOJo42lSGmHK`) exposed in the connection string:
   ```
   postgresql://neondb_owner:npg_tOJo42lSGmHK@ep-fragrant-recipe-a1i8t4gi-pooler.ap-southeast-1.aws.neon.tech/neondb
   ```
   - Log into your Neon console
   - Reset the database password
   - Update your local `.env.local` file with the new password

2. **Better Auth Secret**: Rotate the `BETTER_AUTH_SECRET` value:
   ```bash
   openssl rand -base64 32
   ```
   - Update your local `.env.local` file with the new secret
   - If deployed, update production environment variables

### Prevention

Going forward:
- Never commit `.env.local`, `.env`, or any files containing secrets
- Always use `.env.local.example` with placeholder values for documentation
- The `.gitignore` file is configured to ignore `.env*` files
- Review changes before committing to ensure no secrets are included

### Setup Instructions for New Developers

1. Copy the example file:
   ```bash
   cp frontend/.env.local.example frontend/.env.local
   ```

2. Update `frontend/.env.local` with your actual values:
   - Set your database connection string
   - Generate a new Better Auth secret: `openssl rand -base64 32`

3. Never commit the `.env.local` file - it's ignored by git for security reasons.

---

For security concerns, please create an issue or contact the repository maintainers.
