#!/bin/sh -l

npm i minify@15.0.1 -g

sudo apt-get update
sudo apt-get -y install moreutils

find . -type f -not -path "*/vendor/*" \( -iname \*.html -o -iname \*.js -o -iname \*.css \) | while read fname
    do
    minify ${fname} | sponge ${fname}
    #echo ${fname}
    done