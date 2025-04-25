#ifndef FONT_ATLAS_H
#define FONT_ATLAS_H

#include <SDL2/SDL.h>

// Font atlas structure
typedef struct {
    SDL_Texture* texture;    // The texture containing all character glyphs
    int char_width;          // Width of each character in pixels
    int char_height;         // Height of each character in pixels
    int chars_per_row;       // Number of characters per row in the atlas texture
    int char_count;          // Total number of characters in the atlas
    int first_char;          // First ASCII character in the atlas
} FontAtlas;

// Create a font atlas from pixel data
FontAtlas* create_font_atlas(SDL_Renderer* renderer);

// Destroy and free a font atlas
void destroy_font_atlas(FontAtlas* atlas);

// Calculate the pixel width of a text string when rendered
int measure_text_width(FontAtlas* atlas, const char* text, float scale);

// Render text using the font atlas
void render_text(SDL_Renderer* renderer, FontAtlas* atlas, const char* text,
                int x, int y, SDL_Color color, float scale);

// Render text centered at a specific position
void render_text_centered(SDL_Renderer* renderer, FontAtlas* atlas, const char* text,
                        int x, int y, SDL_Color color, float scale);

// Render text with a drop shadow for better visibility
void render_text_with_shadow(SDL_Renderer* renderer, FontAtlas* atlas, const char* text,
                           int x, int y, SDL_Color color, SDL_Color shadowColor,
                           int offsetX, int offsetY, float scale);

// Render text wrapped to fit within a maximum width
void render_wrapped_text(SDL_Renderer* renderer, FontAtlas* atlas, const char* text,
                       int x, int y, int max_width, SDL_Color color, float scale);

#endif /* FONT_ATLAS_H */
