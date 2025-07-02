# Sentrix Local Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

show_help() {
    echo "Sentrix Local Management Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start       Start all services"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  status      Show service status"
    echo "  logs        Show logs (use -f to follow)"
    echo "  backup      Create backup"
    echo "  restore     Restore from backup"
    echo "  update      Update services"
    echo "  health      Check service health"
    echo "  cleanup     Clean up unused Docker resources"
    echo "  reset       Reset all data (DANGEROUS)"
    echo "  help        Show this help message"
}

start_services() {
    echo "🚀 Starting Sentrix Banking DApp..."
    docker-compose -f docker-compose.prod.yml up -d
}

stop_services() {
    echo "🛑 Stopping Sentrix Banking DApp..."
    docker-compose -f docker-compose.prod.yml down
}

restart_services() {
    echo "🔄 Restarting Sentrix Banking DApp..."
    docker-compose -f docker-compose.prod.yml restart
}

show_status() {
    echo "📊 Service Status:"
    docker-compose -f docker-compose.prod.yml ps
}

show_logs() {
    if [ "$2" = "-f" ]; then
        docker-compose -f docker-compose.prod.yml logs -f
    else
        if [ -z "$2" ]; then
            docker-compose -f docker-compose.prod.yml logs --tail=100
        else
            docker-compose -f docker-compose.prod.yml logs --tail=100 "$2"
        fi
    fi
}

create_backup() {
    echo "💾 Creating backup..."
    mkdir -p backups
    docker exec sentrix-supabase-db-prod pg_dump -U postgres postgres > "backups/backup-$(date +%Y%m%d-%H%M%S).sql"
    echo "Backup created in backups/ directory"
}

restore_backup() {
    if [ -z "$2" ]; then
        print_error "Please specify backup file"
        echo "Usage: $0 restore <backup_file.sql>"
        exit 1
    fi
    
    print_warning "This will restore the database from backup. Continue? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Restoring from backup: $2"
        docker exec -i sentrix-supabase-db-prod psql -U postgres -d postgres < "$2"
        print_success "Backup restored"
    else
        print_status "Restore cancelled"
    fi
}

update_services() {
    echo "🔄 Updating services..."
    docker-compose -f docker-compose.prod.yml pull
    docker-compose -f docker-compose.prod.yml up -d
}

check_health() {
    echo "🔍 Health Check:"
    echo "Nginx: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)"
    echo "Next.js: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)"
    echo "Supabase: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health)"
    echo "Database: $(docker exec sentrix-supabase-db-prod pg_isready -U postgres > /dev/null 2>&1 && echo "Ready" || echo "Not Ready")"
}

cleanup_docker() {
    echo "🧹 Cleaning up Docker resources..."
    docker system prune -f
    docker volume prune -f
}

reset_data() {
    print_error "⚠️  WARNING: This will delete ALL data including databases, blockchain data, and backups!"
    print_warning "This action cannot be undone. Continue? (type 'RESET' to confirm)"
    read -r response
    if [ "$response" = "RESET" ]; then
        print_status "Resetting all data..."
        docker-compose -f docker-compose.prod.yml down -v
        docker system prune -af
        rm -rf backups/*
        print_success "All data reset"
    else
        print_status "Reset cancelled"
    fi
}

# Main script logic
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "$@"
        ;;
    backup)
        create_backup
        ;;
    restore)
        restore_backup "$@"
        ;;
    update)
        update_services
        ;;
    health)
        check_health
        ;;
    cleanup)
        cleanup_docker
        ;;
    reset)
        reset_data
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
