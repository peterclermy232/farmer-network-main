#!/bin/bash

# === CONFIGURATION ===
DB_NAME="farmers_market"
DB_USER="farmers_market_user"
DB_PASS="123"
DB_HOST="localhost"
DB_PORT="5432"

ENV_PATH="./.env"  # Adjust this to /app/.env if needed
SESSION_SECRET=$(openssl rand -hex 32)
STRIPE_SECRET_KEY="your-stripe-secret-key-here"

# === CREATE DATABASE AND USER ===
echo "Creating PostgreSQL user and database..."

sudo -u postgres psql <<EOF
DO \$\$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '${DB_USER}') THEN
      CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';
   END IF;
END
\$\$;

CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
EOF

echo "✅ Database and user created."

# === CREATE .env FILE ===
echo "Generating .env file at ${ENV_PATH}..."

cat <<EOF > "${ENV_PATH}"
# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Session Configuration
SESSION_SECRET=${SESSION_SECRET}

# Stripe Configuration (optional)
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}

# Other Configuration
NODE_ENV=development
EOF

echo "✅ .env file created with secure session key."

# === RUN PRISMA DB PUSH ===
echo "Running database migration (db push)..."
npx prisma db push

echo "✅ Database setup complete!"
echo "You can now start your server or run 'npm run dev'."
