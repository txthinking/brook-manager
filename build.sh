#!/bin/bash

if [ $# -ne 1 ]; then
    echo "./build.sh version"
    exit
fi

denobundle static

mkdir _

deno compile -A --unstable --target x86_64-unknown-linux-gnu -o _/brook-manager_linux_amd64 main.js
deno compile -A --unstable --target x86_64-apple-darwin -o _/brook-manager_darwin_amd64 main.js
deno compile -A --unstable --target aarch64-apple-darwin -o _/brook-manager_darwin_arm64 main.js
deno compile -A --unstable --target x86_64-pc-windows-msvc -o _/brook-manager_windows_amd64.exe main.js

nami release github.com/txthinking/brook-manager $1 _

rm -rf _
