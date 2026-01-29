#!/bin/sh -l

# requires minify@15.0.1 and sponge

mkdir -p dist/manual

cp -r src/* dist/

find . -type f -not -path "*/vendor/*" \( -iwholename \*/dist/\*.html -o -iwholename \*/dist/\*.js -o -iwholename \*/dist/\*.css \) | while read fname
    do
        echo ${fname}
        minify ${fname} | sponge ${fname}
    done