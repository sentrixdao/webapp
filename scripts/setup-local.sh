# Sentrix Local Development Setup Script

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

# Create necessary directories
mkdir -p supabase
mkdir -p data/postgres

# Copy environment file
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo "📝 Created .env.local file. Please update it with your settings."
fi

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if Supabase is ready
echo "🔍 Checking Supabase connection..."
until curl -f http://localhost:54321/rest/v1/ > /dev/null 2>&1; do
    echo "Waiting for Supabase to be ready..."
    sleep 5
done

echo "✅ Supabase is ready!"

# Run database migrations
echo "🗄️ Setting up database schema..."
npm run db:setup

# Deploy smart contracts to local blockchain
echo "📜 Deploying smart contracts..."
npm run contracts:deploy:local

echo "🎉 Local development environment is ready!"
echo ""
echo "📋 Available services:"
echo "   • Next.js App: http://localhost:3000"
echo "   • Supabase API: http://localhost:54321"
echo "   • Supabase Studio: http://localhost:54323"
echo "   • PostgreSQL: localhost:54322"
echo "   • Hardhat Node: http://localhost:8545"
echo ""
echo "🚀 To start the development server:"
echo "   npm run dev"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"
