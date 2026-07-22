#!/bin/bash
function main(){
  printLog INFO "DB Deployment Rollback is in-progress  WALLET_LOCATION=$DOCINTEL_WALLET_LOCATION DOCINTEL_DB_ALIAS=$DOCINTEL_DB_ALIAS"
  printLog INFO "$(whoami)"
  printLog INFO "$(hostname)"

  VERSION=1.0.20
  DOCINTEL_DB_JAR_FILE=docintel-sql-$VERSION.jar
  build_properties
  LOG_PATH=/tmp/docintel-rollback.log
  touch $LOG_PATH
  echo "DOCINTEL DB_ALIAS: $DOCINTEL_DB_ALIAS" >> $LOG_PATH
  echo "DOCINTEL WALLET_LOCATION: $DOCINTEL_WALLET_LOCATION" >> $LOG_PATH
  echo "DOCINTEL DB_JAR_FILE: $DOCINTEL_DB_JAR_FILE" >> $LOG_PATH
                  echo "JAVA version:" $(java -version) >> $LOG_PATH
                  echo "ORACLE_HOME: $ORACLE_HOME" >> $LOG_PATH
  java -Ddocintel.db.driver.class=oracle.jdbc.OracleDriver -Ddocinteldb.enable.wallet=true -Ddocinteldb.wallet.location=$DOCINTEL_WALLET_LOCATION -Ddocintel.db.alias=$DOCINTEL_DB_ALIAS -Ddocinteldb.rollbackfile=/prodlib/db/rollback/rollback-docintel.$VERSION.sql -Ddocintel.db.url=jdbc:oracle:thin:@$DOCINTEL_DB_ALIAS -Doracle.net.tns_admin=$ORACLE_HOME/network/admin -Dliquibase.sql.logLevel=INFO -Doracle.net.wallet_location=$DOCINTEL_WALLET_LOCATION -jar /prodlib/db/EGP-BYOB/downloads/byob-sql/byob-database/$DOCINTEL_DB_JAR_FILE --rollback >> $LOG_PATH 2>&1
  status=`echo $?`
  if [ "$status" == "0" ]
  then
      printLog INFO "DB rollback successful"
  else
      printLog ERROR "DB rollback has failed"
      exit 1
  fi
  printLog INFO "DB Deployment Rollback is done"
}

#######################################################################################################################################################################################################
###     Function name       : build_properties                                                                                                                                                      ###
#######################################################################################################################################################################################################
function build_properties(){
        # Default export assignment
        source ~/.bashrc

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
main