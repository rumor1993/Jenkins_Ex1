#!/bin/sh
# push gitlab

if [ "$1" = ""]
then
    echo "You need to write a push comment "
else 
    git add --all
    git commit -m "$1"
    git push -u origin master
fi 