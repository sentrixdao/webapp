echo "🛑 Stopping Sentrix Banking DApp (Basic Mode)..."

# Stop Next.js development server
echo "Stopping Next.js server..."
pkill -f "next dev" || true

# Stop Docker services
echo "🐳 Stopping Docker services..."
docker-compose -f docker-compose.basic.yml down

echo "✅ All services stopped!"
echo ""
echo "To start again, run: ./scripts/start-basic.sh"
