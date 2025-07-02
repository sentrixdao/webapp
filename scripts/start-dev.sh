# Development startup script

echo "🚀 Starting Sentrix development environment..."

# Check if services are already running
if docker ps | grep -q "sentrix-supabase"; then
    echo "✅ Docker services are already running"
else
    echo "🐳 Starting Docker services..."
    docker-compose up -d
    
    echo "⏳ Waiting for services to be ready..."
    sleep 30
fi

# Check if database is set up
if docker exec sentrix-supabase-db psql -U postgres -d postgres -c "SELECT 1 FROM public.user_profiles LIMIT 1;" > /dev/null 2>&1; then
    echo "✅ Database is already set up"
else
    echo "🗄️ Setting up database..."
    npm run db:setup
fi

# Start Next.js development server
echo "🌐 Starting Next.js development server..."
npm run dev
