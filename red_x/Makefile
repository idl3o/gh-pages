# RED X WebAssembly Build Makefile
#
# This Makefile helps compile the RED X application to WebAssembly
# using the Emscripten toolchain

# Output file names
OUTPUT = index
HTML_FILE = $(OUTPUT).html
WASM_FILE = $(OUTPUT).wasm
JS_FILE = $(OUTPUT).js

# Source files
SOURCES = main.c font_atlas.c

# Emscripten compiler and flags
EMCC = emcc
EMCFLAGS = -Wall -Wextra -O2
EMLDFLAGS = -s WASM=1 -s USE_SDL=2 -s ALLOW_MEMORY_GROWTH=1 -s TOTAL_MEMORY=67108864 \
            -s EXPORTED_RUNTIME_METHODS=['ccall','cwrap'] \
            --preload-file assets

# Default target
all: $(HTML_FILE)

# Rules for compiling to WebAssembly
$(HTML_FILE): $(SOURCES)
	$(EMCC) $(EMCFLAGS) $(SOURCES) -o $(HTML_FILE) $(EMLDFLAGS)

# Create assets directory if it doesn't exist
assets:
	mkdir -p assets

# Clean build files
clean:
	rm -f $(HTML_FILE) $(WASM_FILE) $(JS_FILE) *.data *.js.mem

# Serve the application locally using Python's HTTP server
serve: $(HTML_FILE)
	python -m http.server 8080

# Help target
help:
	@echo "RED X WebAssembly Build Makefile"
	@echo ""
	@echo "Targets:"
	@echo "  all     : Build the WebAssembly application (default)"
	@echo "  clean   : Remove build artifacts"
	@echo "  serve   : Start a local HTTP server to test the application"
	@echo "  help    : Display this help message"

.PHONY: all clean serve help
