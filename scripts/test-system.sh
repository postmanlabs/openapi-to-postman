#!/bin/bash
# ----------------------------------------------------------------------------------------------------------------------
# This script is intended to contain all actions pertaining to repository structure.
#
# ----------------------------------------------------------------------------------------------------------------------

# stop on first error
set -e;

# function to be called on exit
# and ensure cleanup is called before the script exits
function cleanup {
  unset XUNIT_FILE;

  if [ "$?" != "0" ]; then
    exit 1;
  fi
}
trap cleanup EXIT;

# set file for xunit report
export XUNIT_FILE=".tmp/report-system.xml";

# run mocha tests
echo -e "\033[93mRunning mocha system tests...\033[0m";
echo -en "\033[0m\033[2mmocha `mocha --version`\033[0m";

# set mocha reporter
if [ "$CI" = "true" ]; then
  MOCHA_REPORTER="xunit";
  ISTANBUL_REPORT="--report cobertura";
else
  MOCHA_REPORTER="spec";
  ISTANBUL_REPORT="";
fi

# delete old repor directory
[ -d .coverage ] && rm -rf .coverage && mkdir .coverage;

# run test
node --max-old-space-size=2048 node_modules/.bin/istanbul cover ${ISTANBUL_REPORT} \
  --dir ./.coverage -x **/assets/** --print both _mocha -- \
  --reporter ${MOCHA_REPORTER} --reporter-options output=${XUNIT_FILE} \
  test/system/*.test.js --recursive --prof --grep "$1";