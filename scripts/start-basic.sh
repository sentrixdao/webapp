echo "🚀 Starting Sentrix Banking DApp (Basic Mode)..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found. Please create it first."
    echo "You can copy from .env.local.example and customize the values."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

echo "🐳 Starting Docker services..."
docker-compose -f docker-compose.basic.yml up -d

echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are healthy
echo "🔍 Checking service health..."

# Check Supabase
if curl -f http://localhost:54321/health > /dev/null 2>&1; then
    echo "✅ Supabase is running"
else
    echo "⚠️  Supabase is starting up..."
fi

# Check Hardhat node
if curl -f -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 > /dev/null 2>&1; then
    echo "✅ Hardhat node is running"
else
    echo "⚠️  Hardhat node is starting up..."
fi

echo "🌐 Starting Next.js development server..."
npm run dev &

echo ""
echo "🎉 Sentrix Banking DApp is starting up!"
echo ""
echo "📱 Application: http://localhost:3000"
echo "🗄️  Database UI: http://localhost:54323"
echo "⛓️  Blockchain: http://localhost:8545"
echo ""
echo "⏳ Please wait a moment for all services to fully initialize..."
echo "🔄 You can check the status with: ./scripts/check-basic.sh"
echo ""
echo "To stop all services, run: ./scripts/stop-basic.sh"
