#!/usr/bin/env bash

RELEASES=(v1.0 v1.1 v1.2 v1.3 v1.4 v1.5 v1.6 v1.7 v1.8 v1.9 1.9.0 v2.0 v2.1.0 v2.2.0 v2.3.0 v2.3.2 v2.4.0 v2.5.0 v2.5.2 v2.6.0 v2.6.1 v2.7.0 v2.7.1 v2.8.0 v2.8.1 v2.8.2)

mkdir -p releases

for release in ${RELEASES[*]}
do
    echo "Downloading Holder $release"
    wget -qO- https://github.com/imsky/holder/archive/$release.tar.gz | tar xz -C releases/
done