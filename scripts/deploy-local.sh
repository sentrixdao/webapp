# Local Hardware Deployment Script for Sentrix Banking DApp

set -e

echo "🚀 Starting Sentrix Local Hardware Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root"
    exit 1
fi

# Check prerequisites
print_status "Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    print_error ".env.production file not found. Please create it from .env.production.example"
    exit 1
fi

# Load environment variables
source .env.production

# Validate critical environment variables
if [ -z "$POSTGRES_PASSWORD" ] || [ "$POSTGRES_PASSWORD" = "your-super-secure-postgres-password-change-this" ]; then
    print_error "Please set a secure POSTGRES_PASSWORD in .env.production"
    exit 1
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "your-super-secure-jwt-secret-with-at-least-32-characters-long-change-this" ]; then
    print_error "Please set a secure JWT_SECRET in .env.production"
    exit 1
fi

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p nginx/logs
mkdir -p backups
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p logs

# Generate SSL certificates (self-signed for local use)
print_status "Generating SSL certificates..."
if [ ! -f nginx/ssl/cert.pem ]; then
    openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    print_success "SSL certificates generated"
else
    print_warning "SSL certificates already exist"
fi

# Check if ports are available
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        print_error "Port $1 is already in use. Please free up the port or change the configuration."
        return 1
    fi
}

print_status "Checking if required ports are available..."
check_port 80 || exit 1
check_port 443 || exit 1
check_port 3000 || exit 1
check_port 3001 || exit 1
check_port 3002 || exit 1
check_port 5432 || exit 1
check_port 6379 || exit 1
check_port 8000 || exit 1
check_port 8545 || exit 1
check_port 9090 || exit 1

print_success "All required ports are available"

# Install dependencies
print_status "Installing Node.js dependencies..."
npm ci --production

# Build the application
print_status "Building Next.js application..."
npm run build

# Stop any existing containers
print_status "Stopping any existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Pull latest images
print_status "Pulling latest Docker images..."
docker-compose -f docker-compose.prod.yml pull

# Build custom images
print_status "Building custom Docker images..."
docker-compose -f docker-compose.prod.yml build

# Start the services
print_status "Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 60

# Setup database
print_status "Setting up database..."
docker exec sentrix-supabase-db-prod psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/init.sql

# Deploy smart contracts
print_status "Deploying smart contracts..."
npm run contracts:compile
npm run contracts:deploy:local

# Check service health
print_status "Checking service health..."

# Check database
if docker exec sentrix-supabase-db-prod pg_isready -U postgres; then
    print_success "Database is ready"
else
    print_error "Database is not ready"
    exit 1
fi

# Check Next.js app
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Next.js application is ready"
else
    print_error "Next.js application is not ready"
    exit 1
fi

# Final status check
print_status "Performing final status check..."

services=(
    "sentrix-supabase-db-prod:Database"
    "sentrix-supabase-kong-prod:API Gateway"
    "sentrix-nextjs-app-prod:Next.js App"
    "sentrix-nginx-prod:Nginx"
    "sentrix-redis-prod:Redis"
    "sentrix-hardhat-node-prod:Blockchain"
    "sentrix-prometheus-prod:Prometheus"
    "sentrix-grafana-prod:Grafana"
)

all_healthy=true

for service in "${services[@]}"; do
    container_name="${service%%:*}"
    service_name="${service##*:}"
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        print_success "$service_name is running"
    else
        print_error "$service_name is not running"
        all_healthy=false
    fi
done

if [ "$all_healthy" = true ]; then
    print_success "🎉 Sentrix Banking DApp deployed successfully!"
    echo ""
    echo "📊 Access your services:"
    echo "  • Main Application: http://localhost"
    echo "  • Supabase Studio: http://localhost/studio"
    echo "  • Monitoring: http://localhost/monitoring (admin:$GRAFANA_PASSWORD)"
    echo "  • Prometheus: http://localhost:9090"
    echo ""
    echo "🔧 Management commands:"
    echo "  • View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  • Stop services: docker-compose -f docker-compose.prod.yml down"
    echo "  • Restart services: sudo systemctl restart sentrix-banking"
    echo "  • Backup data: ./scripts/backup.sh"
    echo ""
    echo "📁 Important directories:"
    echo "  • Backups: ./backups/"
    echo "  • Logs: ./nginx/logs/ and ./logs/"
    echo "  • SSL Certificates: ./nginx/ssl/"
    echo ""
    print_warning "Remember to:"
    echo "  1. Change default passwords in .env.production"
    echo "  2. Setup proper SSL certificates for production use"
    echo "  3. Configure firewall rules"
    echo "  4. Monitor the application regularly"
else
    print_error "Some services failed to start. Check the logs for details."
    echo "View logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi
