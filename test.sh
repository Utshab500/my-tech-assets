#!/bin/bash
a="prod"
if [[ "$a" == "uat" || "$a" == "prod" ]]; then
  echo "match"
fi