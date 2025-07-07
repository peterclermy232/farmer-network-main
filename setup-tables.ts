import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, products, orders, orderItems, marketPrices } from "@shared/schema";

async function setupDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  const sql = postgres(databaseUrl);
  const db = drizzle(sql);

  try {
    console.log("Creating database tables...");
    
    // Create tables in order (respecting foreign key constraints)
    
    // Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('farmer', 'buyer', 'admin')),
        name TEXT,
        address TEXT,
        phone TEXT,
        bio TEXT,
        profile_picture TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Products table
    await sql`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        farmer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        unit TEXT NOT NULL,
        quantity DOUBLE PRECISION NOT NULL,
        image_url TEXT,
        image TEXT,
        organic BOOLEAN DEFAULT FALSE,
        sku TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Orders table
    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        buyer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_number TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered', 'cancelled')),
        total DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `;

    // Order items table
    await sql`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity DOUBLE PRECISION NOT NULL,
        price DOUBLE PRECISION NOT NULL
      );
    `;

    // Market prices table
    await sql`
      CREATE TABLE IF NOT EXISTS market_prices (
        id SERIAL PRIMARY KEY,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        previous_price DOUBLE PRECISION,
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    console.log("Database tables created successfully!");
    
  } catch (error) {
    console.error("Error creating database tables:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

setupDatabase();