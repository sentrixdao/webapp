echo "🔄 Resetting Sentrix Banking DApp (Basic Mode)..."

# Stop all services
./scripts/stop-basic.sh

echo "🗑️  Removing Docker volumes and containers..."
docker-compose -f docker-compose.basic.yml down -v
docker system prune -f

echo "🔧 Rebuilding services..."
docker-compose -f docker-compose.basic.yml build --no-cache

echo "✅ Reset complete!"
echo ""
echo "To start fresh, run: ./scripts/start-basic.sh"
