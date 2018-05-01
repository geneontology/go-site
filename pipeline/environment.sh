#!/bin/bash
python3 -m venv target/env
. target/env/bin/activate

pip3 install --index-url https://test.pypi.org/simple/ --extra-index-url https://pypi.org/simple  -r requirements.txt

pip3 install ../graphstore/rule-runner
