#!/bin/bash

MACHINE=$(uname -m)
GOARCH=amd64

if [ "$MACHINE" == "x86_64" ]; then
	GOARCH=amd64
elif [ "$MACHINE" == "i686" ]; then
	GOARCH=386
elif [ "$MACHINE" == "aarch64" ]; then
	GOARCH=arm64
elif [ "$MACHINE" == "armv7l" ]; then
	GOARCH=arm
else
	echo "Unknown machine architecture $MACHINE"
	exit 1
fi

mkdir -p /tmp/cloudflared
pushd /tmp/cloudflared
if [ ! -f cloudflared ]; then
	curl -Lo cloudflared "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${GOARCH}"
	chmod +x cloudflared
fi
./cloudflared $@
popd
