#!/bin/bash
echo 'Start #################################################################'

set -e

mongosh <<EOF
use admin
db = db.getSiblingDB('$MONGO_INITDB_DATABASE');
db.createCollection('receipts')
db.createUser(
  {
    user: "$MONGO_INITDB_ROOT_USERNAME",
    pwd: "$MONGO_INITDB_ROOT_PASSWORD",
    roles: [{ role: 'readWrite', db: "$MONGO_INITDB_DATABASE" }],
  },
);
EOF

echo 'END #################################################################'