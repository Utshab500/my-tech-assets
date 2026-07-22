#!/bin/bash
function main(){
        printLog INFO "DB Deployment is in-progress ENV=$ENV, STAGE=$STAGE, NAMESPACE=$NAMESPACE WALLET_LOCATION=$DOCINTEL_WALLET_LOCATION DOCINTEL_DB_ALIAS=$DOCINTEL_DB_ALIAS"
        printLog INFO "$(whoami)"
        printLog INFO "$(hostname)"

      if [[ "$STAGE" == "PREDEPLOY" ]]
        then
   printLog INFO "Executing ORS Report for $ENV"
   rm -rf /prodlib/db/deploy/ORS/*
   orsManifiestFile=/prodlib/db/deploy/ORS/ORS_`date '+%Y-%m-%d_%H-%M-%S'`_${ENV}_docintel-sql-manifest-${RELEASE_ID}_EGP.txt
   touch $orsManifiestFile
                        mkdir -p /prodlib/db/EGP-DOCINTEL/
   rm -rf /prodlib/db/EGP-DOCINTEL/*
   cp -rp $WORKSPACE/downloads/ /prodlib/db/EGP-DOCINTEL/
   find /prodlib/db/EGP-DOCINTEL/ ! -name error.out ! -name release.txt -type f > $orsManifiestFile 2> error.out
   cat $orsManifiestFile
   /prodlib/db/deploy/sql_ors.sh $orsManifiestFile
   sleep 10
   orsDeploFile=$(ls -tr /prodlib/db/deploy/ORS/ORS_*_ORS_*DOCINTEL.txt)
   cp $orsDeploFile $orsManifiestFile
        elif [[ "$STAGE" == "DEPLOY" ]]
        then
   VERSION=1.0.21
   DOCINTEL_DB_JAR_FILE=docintel-sql-$VERSION.jar
   back_rollback_file
   build_properties
   echo "DOCINTEL DB_ALIAS: $DOCINTEL_DB_ALIAS" >> $LOG_PATH
   echo "DOCINTEL WALLET_LOCATION: $DOCINTEL_WALLET_LOCATION" >> $LOG_PATH
   echo "DOCINTEL DB_JAR_FILE: $DOCINTEL_DB_JAR_FILE" >> $LOG_PATH
                        echo "JAVA version:" $(java -version) >> $LOG_PATH
                        echo "ORACLE_HOME: $ORACLE_HOME" >> $LOG_PATH
#    java -Dschema=$SCHEMA -Ddocinteldb.driver.class=oracle.jdbc.OracleDriver -Ddocintel.db.enable.wallet=true -Ddocintel.db.wallet.location=$DOCINTEL_WALLET_LOCATION -Ddocintel.db.alias=$DOCINTEL_DB_ALIAS -Ddocinteldb.rollbackfile=/prodlib/db/rollback/rollback-docintel.$VERSION.sql -Ddocintel.db.url=jdbc:oracle:thin:@$DOCINTEL_DB_ALIAS -Doracle.net.tns_admin=$ORACLE_HOME/network/admin -Dliquibase.sql.logLevel=INFO -Doracle.net.wallet_location=$DOCINTEL_WALLET_LOCATION -jar /prodlib/db/EGP-DOCINTEL/downloads/docintel-sql/docintel-database/$DOCINTEL_DB_JAR_FILE --install >> $LOG_PATH 2>&1
   java -Dschema=$SCHEMA -Ddocintel.db.driver.class=oracle.jdbc.OracleDriver -Ddocinteldb.enable.wallet=true -Ddocinteldb.wallet.location=$DOCINTEL_WALLET_LOCATION -Ddocinteldb.alias=$DOCINTEL_DB_ALIAS -Ddocinteldb.rollbackfile=/prodlib/db/rollback/rollback-docintel.$VERSION.sql -Ddocintel.db.url=jdbc:oracle:thin:@$DOCINTEL_DB_ALIAS -Doracle.net.tns_admin=$ORACLE_HOME/network/admin -Dliquibase.sql.logLevel=INFO -Doracle.net.wallet_location=$DOCINTEL_WALLET_LOCATION -jar /prodlib/db/EGP-DOCINTEL/downloads/docintel-sql/docintel-database/$DOCINTEL_DB_JAR_FILE --install >> $LOG_PATH 2>&1

   status=`echo $?`
   if [ "$status" == "0" ]
   then
                                printLog INFO "Liquibase execution success"
   else
                                printLog ERROR "DB Deployment has failed"
                                exit 1
   fi
        elif [[ "$STAGE" == "POSTDEPLOY" ]]
        then
        echo "No action needed in POSTDEPLOY"
        fi

        printLog INFO "DB Deployment is done ENV=$ENV, STAGE=$STAGE, NAMESPACE=$NAMESPACE"

}

#######################################################################################################################################################################################################
###     Function name       : build_properties                                                                                                                                                      ###
#######################################################################################################################################################################################################
function build_properties(){
        printLog INFO "Checking path exists: db-config/$NAMESPACE"
        # Default export assignment
        source ~/.bashrc

}

function back_rollback_file(){
        FILE_PATH=/prodlib/oracle/db-rollback/rollback.docintel.v1.sql
        BACKUP_FILE_PATH=/prodlib/oracle/db-rollback/rollback.docintel.v1.sql_$(date +"%Y-%m-%d_%H-%M-%S")
        if [ -f "$FILE_PATH" ]; then
        mv "$FILE_PATH" "$BACKUP_FILE_PATH"
        echo "Backup created: $BACKUP_FILE_PATH"
        fi
}

#######################################################################################################################################################################################################
###     Function name       : printLog                                                                                                                                                              ###
###     Function description: Function to print the message to terminal and log file                                                                                                                ###
###     Function usage      :                                                                                                                                                                       ###
###                             PARM1=type, value can be INFO, WARN, ERROR                                                                                                                          ###
###                             PARM2=messages, text to print to output                                                                                                                             ###
#######################################################################################################################################################################################################
function printLog(){
        currdate="date +[%Y-%m-%d\ %H:%M:%S]"
        type=$1
        messages=$2
        IFS=$'\n'
        for message in $messages
        do
                echo "$(eval $currdate) $type [${FUNCNAME[1]}] $message"
                echo "$(eval $currdate) $type [${FUNCNAME[1]}] $message" >> $LOG_PATH
        done
}

#######################################################################################################################################################################################################
###                                                                                      Program starts here                                                                                        ###
#######################################################################################################################################################################################################

export BDIR=$(dirname `readlink -f $0`)
cd $BDIR
HNAM=$(hostname | cut -d"." -f1)
if [ $HNAM = lxegpausgv2e05 ]; then
  echo "ENV = UAT - lxegpausgv2e05"
  DOCINTEL_ENV=lxegpausgv2e05
    DOCINTEL_DB=egpusg
    SCHEMA=DCT
elif [ $HNAM = lxegpapsgv0e05 ]; then
  echo "ENV = PRD - lxegpapsgv0e05"
  DOCINTEL_ENV=lxegpapsgv0e05
  DOCINTEL_DB=egppsg
    SCHEMA=DCT
else
  echo "ENV = SIT - lxegpatsgv0e06"
  DOCINTEL_ENV=lxegpatsgv0e06
  DOCINTEL_DB=egptsg
    SCHEMA=DCT
fi
export DOCINTEL_DB_ALIAS=$DOCINTEL_DB
#export DOCINTEL_WALLET_LOCATION=/prodlib/SCM/wallets/ownegpsg/$DOCINTEL_DB/docintel/$DOCINTEL_ENV
export DOCINTEL_WALLET_LOCATION=/prodlib/SCM/wallets/ownegpsg/$DOCINTEL_DB/dct/$DOCINTEL_ENV
echo "DOCINTEL_DB_ALIAS = $DOCINTEL_DB_ALIAS"
echo "DOCINTEL_WALLET_LOCATION = $DOCINTEL_WALLET_LOCATION"

if [ $# -ne 5 ]
then
        echo "[usage]"
        echo "sh db_deployment.sh [DEV|SIT|UAT|PRD] [PREDEPLOY|DEPLOY|POSTDEPLOY] [RELEASE_ID] [DB_LOG] [NAMESPACE]"
        exit 1
fi

ENV=`echo $1 | tr [:lower:] [:upper:]`
STAGE=`echo $2  | tr [:lower:] [:upper:]`
RELEASE_ID=`echo $3 | tr " " "_"`
RELEASE_ID_ORI=$3
LOG_PATH=$4
NAMESPACE=`echo $5 | tr [:upper:] [:lower:]`
SELECTED_LOGIN_ID=`echo $NAMESPACE | awk -F'-' '{print $NF}'`

main