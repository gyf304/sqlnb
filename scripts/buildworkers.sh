#!/bin/bash

set -e
for i in "src/workers/*.ts"; do
	echo "Building $i"
	yarn run esbuild \
		--bundle \
		--minify \
		--legal-comments=linked \
		--sourcemap \
		--target=chrome60 \
		--loader:.png=file \
		--loader:.jpg=file \
		--loader:.wasm=file \
		--loader:.sql=text \
		--allow-overwrite \
		$i \
		$@
done
