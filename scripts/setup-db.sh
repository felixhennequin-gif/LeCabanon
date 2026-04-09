#!/bin/bash
set -e

echo "Création de la base de données lecabanon..."
sudo -u postgres psql -c "CREATE DATABASE lecabanon;" 2>/dev/null || echo "DB existe déjà"
sudo -u postgres psql -c "CREATE USER lecabanon_user WITH PASSWORD 'CHANGE_ME';" 2>/dev/null || echo "User existe déjà"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE lecabanon TO lecabanon_user;"
sudo -u postgres psql -c "ALTER DATABASE lecabanon OWNER TO lecabanon_user;"

echo "✅ Base de données lecabanon prête"
echo "N'oublie pas de mettre à jour DATABASE_URL dans backend/.env :"
echo "DATABASE_URL=postgresql://lecabanon_user:CHANGE_ME@localhost:5432/lecabanon"
