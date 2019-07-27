#!/bin/
echo "====================="
echo "build start"
# export GH_TOKEN='개인의 GH_TOKEN'
# export CSC_LINK='.p12 키파일의 경로'
# export CSC_KEY_PASSWORD='qwer1234!'
# export WIN_CSC_LINK='.pfx 키파일의 경로'
# export WIN_CSC_KEY_PASSWORD='qwer1234!'
echo "====================="
echo "clean dist"
echo "====================="
npm run clean-dist
echo "====================="
echo "build mac,win"
echo "====================="
node_modules/.bin/build -mw --x64 --ia32
# echo "build win32 x64"
# echo "====================="
# node_modules/.bin/build -w --x64 --ia32
# echo "====================="
# echo "build mac"
# echo "====================="
# node_modules/.bin/build -m
echo "====================="
echo "build fisnished! check /dist"
echo "====================="
open ./dist
