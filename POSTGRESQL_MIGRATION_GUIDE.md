# PostgreSQL Migration Guide for UFC Picks App

This guide will help you migrate your UFC Picks application from SQLite to PostgreSQL for production deployment on Heroku.

## Prerequisites

- Heroku CLI installed
- Git repository set up
- Existing SQLite database with data

## Step 1: Install Dependencies

First, install the new PostgreSQL dependencies:

```bash
cd server
npm install
```

This will install:
- `pg` - PostgreSQL driver for Node.js
- `pg-hstore` - For handling hstore data type

## Step 2: Set Up Heroku Postgres

1. **Create a new Heroku app** (if you haven't already):
   ```bash
   heroku create your-ufc-picks-app
   ```

2. **Add PostgreSQL addon**:
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

3. **Verify the DATABASE_URL**:
   ```bash
   heroku config:get DATABASE_URL
   ```

## Step 3: Configure Environment Variables

Set the required environment variables on Heroku:

```bash
# Set JWT secret (use a strong, random string)
heroku config:set JWT_SECRET="your-super-secret-jwt-key-here"

# Set CORS origin to your app URL
heroku config:set CORS_ORIGIN="https://your-ufc-picks-app.herokuapp.com"

# Set other security options
heroku config:set ENABLE_RATE_LIMITING="true"
heroku config:set ENABLE_STRICT_CORS="true"
```

## Step 4: Test Migration Locally (Optional)

Before deploying, you can test the migration locally:

1. **Set up local PostgreSQL** (if you have it installed):
   ```bash
   # Create a local .env file with your PostgreSQL connection
   echo "DATABASE_URL=postgres://username:password@localhost:5432/ufc_picks" > .env
   echo "NODE_ENV=production" >> .env
   ```

2. **Run the migration script**:
   ```bash
   npm run migrate:sqlite-to-postgres
   ```

## Step 5: Deploy to Heroku

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Migrate from SQLite to PostgreSQL"
   ```

2. **Push to Heroku**:
   ```bash
   git push heroku main
   ```

3. **Monitor the deployment**:
   ```bash
   heroku logs --tail
   ```

## Step 6: Verify Migration

1. **Check the logs** to ensure migration completed successfully
2. **Test your application** by visiting the Heroku URL
3. **Verify data integrity** by checking if users, events, and picks are accessible

## Troubleshooting

### Common Issues

1. **Migration fails on startup**:
   - Check if DATABASE_URL is set correctly
   - Ensure PostgreSQL addon is active
   - Check Heroku logs for specific error messages

2. **Connection timeout**:
   - PostgreSQL might be starting up (wait a few minutes)
   - Check if your app is on the correct dyno type

3. **SSL connection issues**:
   - The migration script handles SSL automatically
   - Ensure you're using the latest version of the `pg` package

### Rollback Plan

If something goes wrong, you can:

1. **Revert to previous commit**:
   ```bash
   git revert HEAD
   git push heroku main
   ```

2. **Restart the app**:
   ```bash
   heroku restart
   ```

## Post-Migration Tasks

1. **Update your client-side code** if you have any hardcoded database references
2. **Test all functionality** thoroughly
3. **Monitor performance** - PostgreSQL should be faster for complex queries
4. **Set up database backups** using Heroku's built-in backup features

## Performance Considerations

- PostgreSQL connection pooling is configured for optimal performance
- SSL connections are enabled for security
- Consider upgrading to a larger PostgreSQL plan if you expect high traffic

## Security Notes

- JWT_SECRET should be a strong, random string
- CORS_ORIGIN should be set to your specific domain
- Rate limiting and strict CORS are enabled by default
- SSL connections are enforced for database communication

## Support

If you encounter issues:
1. Check Heroku logs: `heroku logs --tail`
2. Verify environment variables: `heroku config`
3. Check PostgreSQL status: `heroku pg:info`
4. Review the migration script output for specific errors

---

**Note**: After successful migration, your SQLite database file (`database.sqlite`) will remain in your local development environment. You can keep it for local development or remove it if you prefer to use PostgreSQL locally as well.
