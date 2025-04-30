#ifndef FONT_ATLAS_H
#define FONT_ATLAS_H

#include <SDL.h>

// Font atlas structure definition
typedef struct {
    SDL_Texture* texture;
    int char_width;
    int char_height;
    int atlas_width;
    int atlas_height;
    int chars_per_row;
} FontAtlas;

// Font atlas functions
FontAtlas* create_font_atlas(SDL_Renderer* renderer);
void destroy_font_atlas(FontAtlas* atlas);
void render_text(SDL_Renderer* renderer, FontAtlas* atlas, const char* text, int x, int y, SDL_Color color, float scale);
void render_text_centered(SDL_Renderer* renderer, FontAtlas* atlas, const char* text, int x, int y, SDL_Color color, float scale);

#endif /* FONT_ATLAS_H */
