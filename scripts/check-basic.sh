echo "🔍 Checking Sentrix Banking DApp Status..."
echo ""

# Check Docker services
echo "📦 Docker Services:"
docker-compose -f docker-compose.basic.yml ps

echo ""
echo "🌐 Service Health Checks:"

# Check Next.js app
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Next.js App: Running (http://localhost:3000)"
else
    echo "❌ Next.js App: Not responding"
fi

# Check Supabase
if curl -f http://localhost:54321/health > /dev/null 2>&1; then
    echo "✅ Supabase API: Running (http://localhost:54321)"
else
    echo "❌ Supabase API: Not responding"
fi

# Check Supabase Studio
if curl -f http://localhost:54323 > /dev/null 2>&1; then
    echo "✅ Supabase Studio: Running (http://localhost:54323)"
else
    echo "❌ Supabase Studio: Not responding"
fi

# Check Database
if docker exec sentrix-supabase-db pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ Database: Running"
else
    echo "❌ Database: Not responding"
fi

# Check Hardhat node
if curl -f -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://localhost:8545 > /dev/null 2>&1; then
    echo "✅ Hardhat Node: Running (http://localhost:8545)"
else
    echo "❌ Hardhat Node: Not responding"
fi

echo ""
echo "📊 Quick Stats:"
echo "Database connections: $(docker exec sentrix-supabase-db psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | xargs || echo "N/A")"
echo "Docker containers: $(docker ps --filter "name=sentrix" --format "table {{.Names}}" | wc -l | xargs)"

echo ""
if curl -f http://localhost:3000 > /dev/null 2>&1 && curl -f http://localhost:54321/health > /dev/null 2>&1; then
    echo "🎉 All core services are running!"
    echo "You can access the app at: http://localhost:3000"
else
    echo "⚠️  Some services may still be starting up. Wait a moment and try again."
fi
