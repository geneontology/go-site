#!/bin/sh

wget -O refg_id_list.txt --passive-ftp ftp://ftp.informatics.jax.org/pub/curatorwork/GODB/refg_id_list.txt
load-refg-set-full.pl $* refg_id_list.txt 