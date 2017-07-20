#!/bin/bash

echo "$VIRTUAL_ENV"
printenv

python3 -m venv target/env
. target/env/bin/activate

echo "$VIRTUAL_ENV"

pip3 install -r requirements.txt

pip3 install ../graphstore/rule-runner

make extra_files

make all_pombase
