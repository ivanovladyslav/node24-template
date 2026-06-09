#!/bin/bash
set -e
npm install
exec node --watch src/index.js
