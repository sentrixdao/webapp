# Stop all development services

echo "🛑 Stopping Sentrix development environment..."

# Stop Next.js if running
pkill -f "next dev" || true

# Stop Docker services
docker-compose down

echo "✅ All services stopped"
