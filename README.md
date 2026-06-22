<div align="center">
    <img src="front-panel/public/LOGO.png" alt="Voguewalk Logo" width="280" />
</div>

# Voguewalk - E-commerce Platform

A modern full-stack e-commerce application built with React Router v7, Supabase, and Tailwind CSS.

## Features

### Product Management
- Add and manage products with multiple variants
- Support for variant-specific images, pricing, stock, and attributes
- Flexible attribute system (Color, Size, Material, Style, Brand)
- Organized category and sub-category structure

### Collections
- Create and manage product collections
- Add specific products to collections
- Browse collection-based products on the storefront

### Coupons & Discounts
- Two coupon types: **Manual** and **Automatic**
- Time-based activation (start/end dates)
- Target specific customer groups (All, Consumers, Admins, Employees)
- Support for specific customer emails
- Multiple discount types:
  - Fixed amount or percentage on entire order
  - Fixed amount or percentage on specific products

### Payments
- Stripe integration for online payments
- Cash on Delivery support
- Automated payment status updates via webhooks

### Admin Panel
- Complete admin dashboard
- Sales analytics with trend charts
- Top selling products
- Recent orders overview
- Sales distribution by province (pie chart)
- Low stock alerts and restock management

### Frontend Experience
- Fast and responsive product browsing
- Advanced search with multiple filters
- Smooth product detail view with image carousel
- Shopping cart and wishlist functionality

### Upcoming
- Email notifications (order confirmation, signup, promotions)
- Product review system

## Tech Stack

- **Frontend+Backend**: React Router v7, TypeScript, Tailwind CSS, shadcn/ui
- **Database+Auth+Webhooks**: Supabase (PostgreSQL + Auth)
- **Data Caching**: TanStack Query
- **Forms**: React Hook Form + Zod

## Project Structure

```
(root)
├── front-panel/      # Public storefront
├── admin/            # Admin dashboard
├── shared/           # Shared types and utilities
├── supabase/         # Database migrations
├── .env.example
└── package.json
```

## Getting Started

### 1. Clone the repository

```bash
https://github.com/talha5978/ecommerce-rr7-supabase.git
cd ecommerce-rr7-supabase
```

### 2. Install dependencies

```bash
npm install
```

### 3. Development

```bash
# Front Panel (Store)
cd front-panel
npm run dev

# Admin Panel
cd admin
npm run dev

# Better Alternative
npm run dev:front
npm run dev:admin

# Global formatter
npm run format
```

### 4. Build

```bash
# Build shared package first
npm run build:shared

# Build front panel
npm run build:front

# Build admin panel
npm run build:admin
```

### 5. Docker

```bash
# Build image
docker build -f front-panel/Dockerfile -t voguewalk .

# Run container
docker rm -f voguewalk 2>/dev/null || true
docker run --rm \
  --env-file .env \
  -p 3000:3000 \
  --name voguewalk \
  voguewalk
```

Open [http://localhost:3000](http://localhost:3000)

## Database Setup (Supabase)

1. Go to your Supabase Dashboard → **SQL Editor**
2. Copy the contents of the migration file run the migration file:
    ```sql
    supabase/migrations/..._remote_schema.sql
    ```
3. Run any additional functions (category/sub-category deletion, etc.) if needed.

## Environment Variables

Copy `.env.sample` to `.env` and fill in the required values:

```
VITE_ENV=<production or development>
VITE_APP_URL=<ADD_YOUR_APP_URL_IN_PRODUCTION>
VITE_PROJECT_ID=<ADD_YOUR_PROJECT_ID>
VITE_SUPABASE_URL=<ADD_YOUR_SUPABASE_URL>
VITE_MAIN_APP_URL=<http://localhost:5173 OR https://example.store>

SUPABASE_ANON_KEY=<ADD_YOUR_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE__KEY=<ADD_YOUR_SUPABASE_SERVICE_ROLE_KEY>

VITE_STRIPE_PUBLISHABLE_KEY=<INSERT_KEY_FROM_STRIPE_DASHBOARD>
STRIPE_SECRET_KEY=<INSERT_KEY_FROM_STRIPE_DASHBOARD>
```

## Deployment

This project is configured for deployment on Render, Railway, or any Docker-based platform using the provided Dockerfile. Currently the front-panel is deployed on render web service. Here is the path that you may follow to deploy a web service of this app to production.

1. **Name:** my-ecom-app (or anything)
2. **Environment:** Docker
3. **Region:** Singapore (or any other)
4. **Dockerfile Path:** front-panel/Dockerfile
5. **Environment Variables:** Add these from .env
6. **Secret Variable File:** Name set to .env file and copy paste .env content

<u><i>Developed by Talha<i><u>