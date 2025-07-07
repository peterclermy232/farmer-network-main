#!/bin/bash

# Database setup script for Farmers Market
echo "Setting up PostgreSQL database for Farmers Market..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Installing..."
    
    # Update package list
    sudo apt-get update
    
    # Install PostgreSQL
    sudo apt-get install -y postgresql postgresql-contrib
    
    # Start PostgreSQL service
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Create database user and database
sudo -u postgres psql -c "CREATE USER farmers_market_user WITH PASSWORD 'farmers_market_password';"
sudo -u postgres psql -c "CREATE DATABASE farmers_market OWNER farmers_market_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE farmers_market TO farmers_market_user;"

# Update .env file with actual database URL
sed -i 's|DATABASE_URL=postgresql://username:password@localhost:5432/farmers_market|DATABASE_URL=postgresql://farmers_market_user:farmers_market_password@localhost:5432/farmers_market|g' /app/.env

echo "Database setup complete!"
echo "Database URL: postgresql://farmers_market_user:farmers_market_password@localhost:5432/farmers_market"
echo "You can now run 'npm run db:push' to create the database tables."