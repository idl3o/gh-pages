CC = gcc
CFLAGS = -Wall -Wextra -std=c99
LDFLAGS = `sdl2-config --libs`
INCLUDES = `sdl2-config --cflags`

all: red_x

red_x: main.c
	$(CC) $(CFLAGS) $(INCLUDES) -o $@ $< $(LDFLAGS)

# Updated web target for GitHub Pages compatibility
web: main.c template.html
	emcc $< -o index.html -s USE_SDL=2 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 \
		--shell-file template.html -s NO_EXIT_RUNTIME=1 -s EXPORTED_RUNTIME_METHODS=cwrap \
		-s ENVIRONMENT=web -s MODULARIZE=1 -s EXPORT_NAME="RedXModule"

template.html:
	# Use a GitHub Pages compatible template
	if [ ! -f template.html ]; then \
		cp index.html template.html && \
		sed -i.bak 's|/api/version|#|g' template.html && \
		sed -i.bak 's|/socket.io/socket.io.js|https://cdn.socket.io/4.5.0/socket.io.min.js|g' template.html; \
	fi

node_modules: package.json
	npm install

serve: web node_modules
	node server.js

# Add target for GitHub Pages
gh-pages: web
	mkdir -p ../gh-pages-build
	cp index.html index.js index.wasm ../gh-pages-build/
	cp -r js ../gh-pages-build/

clean:
	rm -f red_x
	rm -f index.html index.js index.wasm template.html template.html.bak
