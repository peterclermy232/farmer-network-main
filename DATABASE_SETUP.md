# Database Setup and Migration Guide

This guide will help you set up the PostgreSQL database and remove mock data from the Farmers Market application.

## Changes Made

### 1. Database Integration
- ✅ **Removed in-memory storage**: Replaced with PostgreSQL database integration
- ✅ **Removed mock data**: Eliminated hardcoded admin user and market prices
- ✅ **Real database storage**: All data now persists in PostgreSQL

### 2. Security Improvements
- ✅ **Email uniqueness**: Added unique constraint on email addresses
- ✅ **Password validation**: Enhanced password strength requirements (minimum 8 characters)
- ✅ **Input validation**: Added email format validation
- ✅ **Duplicate prevention**: Prevents duplicate usernames and emails

### 3. Authentication Enhancements
- ✅ **Better registration**: Improved user registration with proper validation
- ✅ **Error handling**: Better error messages for duplicate users
- ✅ **Security**: Password hashing with scrypt (already implemented)

## Database Setup Instructions

### Option 1: Automatic Setup (Recommended)
```bash
# Run the database setup script
./setup-db.sh

# Create database tables
npm run db:push
```

### Option 2: Manual Setup
1. **Install PostgreSQL** (if not already installed):
   ```bash
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Create database and user**:
   ```bash
   sudo -u postgres psql
   CREATE USER farmers_market_user WITH PASSWORD 'farmers_market_password';
   CREATE DATABASE farmers_market OWNER farmers_market_user;
   GRANT ALL PRIVILEGES ON DATABASE farmers_market TO farmers_market_user;
   \q
   ```

3. **Update environment variables**:
   ```bash
   # Edit .env file
   DATABASE_URL=postgresql://farmers_market_user:farmers_market_password@localhost:5432/farmers_market
   ```

4. **Create database tables**:
   ```bash
   npm run db:push
   ```

### Option 3: Custom Database Setup
If you have your own PostgreSQL instance:
1. Update the `DATABASE_URL` in `.env` file with your database credentials
2. Run `npm run db:push` to create tables

## What's Changed

### Before (Mock Data Issues)
- ❌ Used in-memory storage that didn't persist
- ❌ Had hardcoded admin user: `admin` / `admin123`
- ❌ Had hardcoded market prices
- ❌ Only username uniqueness (not email)
- ❌ Basic password validation

### After (Real Database)
- ✅ PostgreSQL database with persistent storage
- ✅ No hardcoded users - all users must register
- ✅ No hardcoded market prices - admin must add through panel
- ✅ Both username and email uniqueness enforced
- ✅ Enhanced password validation (minimum 8 characters)
- ✅ Email format validation
- ✅ Better error handling and validation

## Testing the Changes

### 1. User Registration
- Try registering with the same username twice (should fail)
- Try registering with the same email twice (should fail)
- Try registering with a password less than 8 characters (should fail)
- Try registering with invalid email format (should fail)

### 2. Admin Setup
Since there's no hardcoded admin user anymore:
1. Register a new user through the normal registration flow
2. Manually update their role to 'admin' in the database:
   ```sql
   UPDATE users SET role = 'admin' WHERE username = 'your_username';
   ```

### 3. Market Prices
- Market prices table will be empty initially
- Admin users can add market prices through the admin panel
- No more hardcoded prices

## Environment Variables

Make sure your `.env` file contains:
```env
DATABASE_URL=postgresql://farmers_market_user:farmers_market_password@localhost:5432/farmers_market
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
NODE_ENV=development
```

## Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up database** (if not done):
   ```bash
   ./setup-db.sh
   npm run db:push
   ```

3. **Start the application**:
   ```bash
   npm run dev
   ```

## Security Features

1. **Password Hashing**: Uses scrypt for secure password hashing
2. **Session Management**: Secure session handling with express-session
3. **Input Validation**: Comprehensive validation for all user inputs
4. **Unique Constraints**: Prevents duplicate usernames and emails
5. **SQL Injection Protection**: Uses parameterized queries via Drizzle ORM

## Database Schema

The application uses the following tables:
- `users` - User accounts with roles (farmer, buyer, admin)
- `products` - Products listed by farmers
- `orders` - Orders placed by buyers
- `order_items` - Items within each order
- `market_prices` - Market price data (managed by admin)

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if stopped
sudo systemctl start postgresql

# Check database connection
psql -U farmers_market_user -d farmers_market -h localhost
```

### Permission Issues
```bash
# Make sure the user has proper permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE farmers_market TO farmers_market_user;"
```

### Table Creation Issues
```bash
# Check if tables exist
psql -U farmers_market_user -d farmers_market -h localhost -c "\dt"

# Manually create tables if needed
npm run db:push
```

## API Changes

All API endpoints remain the same, but now:
- Data persists in PostgreSQL database
- Better validation and error handling
- No mock data responses
- Real-time data updates

The application is now ready for production use with a real database backend!