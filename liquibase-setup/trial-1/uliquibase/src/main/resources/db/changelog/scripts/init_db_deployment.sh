#!/bin/bash

echo "Enter DB Server IP:"
read DB_SERVER_IP

echo "Enter DB Server Port:"
read DB_SERVER_PORT

echo "Enter DB SID:"
read DB_SID

echo "Enter DB Server User:"
read DB_SERVER_USER

echo "Enter DB Server Password:"
read -s DB_SERVER_PASSWORD
echo ""

echo "Enter DB JAR Location:"
read DB_JAR_LOCATION

java -Degp.db.driver.class=oracle.jdbc.OracleDriver \
     -Degp.db.url=jdbc:oracle:thin:@//$DB_SERVER_IP:$DB_SERVER_PORT/$DB_SID \
     -Degp.db.user=$DB_SERVER_USER \
     -Degp.db.pwd=$DB_SERVER_PASSWORD \
     -Degpdb.rollbackfile=/prodlib/db/rollback.v1.sql \
     -jar $DB_JAR_LOCATION \
     --install