#!/usr/bin/env bash
read -s -p "Password: " pwd && echo
node -e "const b=require('bcryptjs');console.log(b.hashSync('$pwd',10))"
