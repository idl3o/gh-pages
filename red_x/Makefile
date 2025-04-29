CC = gcc
EMCC = emcc
CFLAGS = -Wall -Wextra
LDFLAGS = `sdl2-config --libs`
WEBFLAGS = -s USE_SDL=2 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s 'EXPORTED_RUNTIME_METHODS=["ccall"]' -s 'SDL2_IMAGE_FORMATS=["png"]'

SRC = main.c font_atlas.c
OBJ = $(SRC:.c=.o)
WEBSRC = main.c font_atlas.c
WEBOBJ = $(WEBSRC:.c=.o)

TARGET = red_x
WEBTARGET = index.html

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CC) $(OBJ) -o $(TARGET) $(LDFLAGS) -lm

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

web: $(WEBTARGET)

$(WEBTARGET): $(WEBSRC)
	$(EMCC) $(CFLAGS) $(WEBFLAGS) $(WEBSRC) -o $(WEBTARGET) -lm

clean:
	rm -f $(OBJ) $(TARGET) $(WEBOBJ) $(WEBTARGET) index.js index.wasm

.PHONY: all web clean
