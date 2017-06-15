#!/bin/bash
python3 -m venv target/env
. target/env/bin/activate

pip3 install -r requirements.txt
