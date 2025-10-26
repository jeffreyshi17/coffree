#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 FreeCoffee Database Setup${NC}"
echo ""

# Extract project ref from Supabase URL
PROJECT_REF="myeozdxkdowaaeuarogo"

echo "Your Supabase project: $PROJECT_REF"
echo ""
echo -e "${YELLOW}To get your database password:${NC}"
echo "1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
echo "2. Copy the 'Database Password' or reset it"
echo ""
echo -n "Enter your Supabase database password: "
read -s DB_PASSWORD
echo ""
echo ""

# Construct connection string
DB_URL="postgresql://postgres:$DB_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres"

echo "Connecting to database..."
echo ""

# Run the SQL file
PGPASSWORD=$DB_PASSWORD psql "$DB_URL" -f lib/supabase-schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Database setup complete!${NC}"
    echo -e "${GREEN}🎉 Your FreeCoffee app is ready to use!${NC}"
else
    echo ""
    echo "❌ Setup failed. Please check your password and try again."
fi
