#!/bin/sh
set -e

# Mount loop image if not mounted
if ! grep -qs '/var/lib/postgresql ' /proc/mounts; then
    mkdir -p /var/lib/postgresql
    mount /mnt/host/e/kognisync_data/pg.img /var/lib/postgresql
fi
chown -R postgres:postgres /var/lib/postgresql

# Initdb if data dir doesn't exist
if [ ! -f /var/lib/postgresql/data/PG_VERSION ]; then
    mkdir -p /var/lib/postgresql/data
    chown postgres:postgres /var/lib/postgresql/data
    su - postgres -c "initdb -D /var/lib/postgresql/data --auth=trust"
    echo "port = 5434" >> /var/lib/postgresql/data/postgresql.conf
    echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf
    echo "host all all 0.0.0.0/0 trust" >> /var/lib/postgresql/data/pg_hba.conf
    echo "host all all ::0/0 trust" >> /var/lib/postgresql/data/pg_hba.conf
fi

# Ensure /run/postgresql exists
mkdir -p /run/postgresql
chown -R postgres:postgres /run/postgresql

# Stop existing postgres if running
su - postgres -c "pg_ctl -D /var/lib/postgresql/data stop" || true

# Start postgres
su - postgres -c "pg_ctl -D /var/lib/postgresql/data -l /var/lib/postgresql/logfile start"

# Wait for postgres to be ready
sleep 2

# Create user & db
su - postgres -c "psql -p 5434 -tc \"SELECT 1 FROM pg_user WHERE usename = 'kognisync'\"" | grep -q 1 || \
    su - postgres -c "psql -p 5434 -c \"CREATE USER kognisync WITH PASSWORD 'kognisync_pass' SUPERUSER;\""

su - postgres -c "psql -p 5434 -tc \"SELECT 1 FROM pg_database WHERE datname = 'kognisync_db'\"" | grep -q 1 || \
    su - postgres -c "psql -p 5434 -c \"CREATE DATABASE kognisync_db OWNER kognisync;\""

echo "PostgreSQL is ready on port 5434!"

# Redis
pkill -f redis-server || true
redis-server --port 6380 --bind 0.0.0.0 --protected-mode no --daemonize yes
echo "Redis is ready on port 6380!"

# Keep session alive so WSL doesn't terminate services
exec tail -f /dev/null
