echo "🚀 Setting up Sentrix for local development..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# Database
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Etherscan API for real blockchain data
NEXT_PUBLIC_ETHERSCAN_API_KEY=

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
    echo "✅ Created .env.local file"
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 15

# Check if PostgreSQL is ready
echo "🔍 Checking database connection..."
until docker exec sentrix-postgres pg_isready -U postgres -d sentrix > /dev/null 2>&1; do
    echo "Waiting for PostgreSQL to be ready..."
    sleep 3
done

echo "✅ Database is ready!"

# Check if Supabase REST API is ready
echo "🔍 Checking Supabase REST API..."
until curl -f http://localhost:54321/ > /dev/null 2>&1; do
    echo "Waiting for Supabase REST API to be ready..."
    sleep 3
done

echo "✅ Supabase REST API is ready!"

echo "🎉 Local development environment is ready!"
echo ""
echo "📋 Available services:"
echo "   • Next.js App: http://localhost:3000"
echo "   • Supabase REST API: http://localhost:54321"
echo "   • PostgreSQL: localhost:5432"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "🛑 To stop all services:"
echo "   npm run docker:down"
