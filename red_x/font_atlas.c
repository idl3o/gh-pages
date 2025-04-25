#include "font_atlas.h"
#include <stdlib.h>
#include <string.h>

// Built-in pixel font data (5x7 font)
// Each character is represented as a series of bytes
// where each bit is a pixel (1 = pixel, 0 = transparent)
static const unsigned char FONT_DATA[] = {
    // Space
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,

    // ! (33)
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00000000,
    0b00100000,
    0b00000000,

    // " (34)
    0b01010000,
    0b01010000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,

    // # (35)
    0b01010000,
    0b01010000,
    0b11111000,
    0b01010000,
    0b11111000,
    0b01010000,
    0b00000000,

    // $ (36)
    0b00100000,
    0b01111000,
    0b10100000,
    0b01110000,
    0b00101000,
    0b11110000,
    0b00100000,

    // % (37)
    0b11001000,
    0b11001000,
    0b00010000,
    0b00100000,
    0b01000000,
    0b10011000,
    0b10011000,

    // & (38)
    0b01100000,
    0b10010000,
    0b10100000,
    0b01000000,
    0b10101000,
    0b10010000,
    0b01101000,

    // ' (39)
    0b00100000,
    0b00100000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,

    // ( (40)
    0b00010000,
    0b00100000,
    0b01000000,
    0b01000000,
    0b01000000,
    0b00100000,
    0b00010000,

    // ) (41)
    0b01000000,
    0b00100000,
    0b00010000,
    0b00010000,
    0b00010000,
    0b00100000,
    0b01000000,

    // * (42)
    0b00000000,
    0b01010000,
    0b00100000,
    0b11111000,
    0b00100000,
    0b01010000,
    0b00000000,

    // + (43)
    0b00000000,
    0b00100000,
    0b00100000,
    0b11111000,
    0b00100000,
    0b00100000,
    0b00000000,

    // , (44)
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00110000,
    0b00110000,
    0b01000000,

    // - (45)
    0b00000000,
    0b00000000,
    0b00000000,
    0b11111000,
    0b00000000,
    0b00000000,
    0b00000000,

    // . (46)
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b01100000,
    0b01100000,

    // / (47)
    0b00001000,
    0b00010000,
    0b00100000,
    0b01000000,
    0b10000000,
    0b00000000,
    0b00000000,

    // 0 (48)
    0b01110000,
    0b10001000,
    0b10011000,
    0b10101000,
    0b11001000,
    0b10001000,
    0b01110000,

    // 1 (49)
    0b00100000,
    0b01100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b01110000,

    // 2 (50)
    0b01110000,
    0b10001000,
    0b00001000,
    0b00010000,
    0b00100000,
    0b01000000,
    0b11111000,

    // 3 (51)
    0b11111000,
    0b00010000,
    0b00100000,
    0b00010000,
    0b00001000,
    0b10001000,
    0b01110000,

    // 4 (52)
    0b00010000,
    0b00110000,
    0b01010000,
    0b10010000,
    0b11111000,
    0b00010000,
    0b00010000,

    // 5 (53)
    0b11111000,
    0b10000000,
    0b11110000,
    0b00001000,
    0b00001000,
    0b10001000,
    0b01110000,

    // 6 (54)
    0b00110000,
    0b01000000,
    0b10000000,
    0b11110000,
    0b10001000,
    0b10001000,
    0b01110000,

    // 7 (55)
    0b11111000,
    0b00001000,
    0b00010000,
    0b00100000,
    0b01000000,
    0b01000000,
    0b01000000,

    // 8 (56)
    0b01110000,
    0b10001000,
    0b10001000,
    0b01110000,
    0b10001000,
    0b10001000,
    0b01110000,

    // 9 (57)
    0b01110000,
    0b10001000,
    0b10001000,
    0b01111000,
    0b00001000,
    0b00010000,
    0b01100000,

    // : (58)
    0b00000000,
    0b01100000,
    0b01100000,
    0b00000000,
    0b01100000,
    0b01100000,
    0b00000000,

    // ; (59)
    0b00000000,
    0b01100000,
    0b01100000,
    0b00000000,
    0b01100000,
    0b01100000,
    0b10000000,

    // < (60)
    0b00010000,
    0b00100000,
    0b01000000,
    0b10000000,
    0b01000000,
    0b00100000,
    0b00010000,

    // = (61)
    0b00000000,
    0b00000000,
    0b11111000,
    0b00000000,
    0b11111000,
    0b00000000,
    0b00000000,

    // > (62)
    0b10000000,
    0b01000000,
    0b00100000,
    0b00010000,
    0b00100000,
    0b01000000,
    0b10000000,

    // ? (63)
    0b01110000,
    0b10001000,
    0b00001000,
    0b00010000,
    0b00100000,
    0b00000000,
    0b00100000,

    // @ (64)
    0b01110000,
    0b10001000,
    0b10111000,
    0b10101000,
    0b10111000,
    0b10000000,
    0b01110000,

    // A (65)
    0b01110000,
    0b10001000,
    0b10001000,
    0b11111000,
    0b10001000,
    0b10001000,
    0b10001000,

    // B (66)
    0b11110000,
    0b10001000,
    0b10001000,
    0b11110000,
    0b10001000,
    0b10001000,
    0b11110000,

    // C (67)
    0b01110000,
    0b10001000,
    0b10000000,
    0b10000000,
    0b10000000,
    0b10001000,
    0b01110000,

    // D (68)
    0b11110000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b11110000,

    // E (69)
    0b11111000,
    0b10000000,
    0b10000000,
    0b11110000,
    0b10000000,
    0b10000000,
    0b11111000,

    // F (70)
    0b11111000,
    0b10000000,
    0b10000000,
    0b11110000,
    0b10000000,
    0b10000000,
    0b10000000,

    // G (71)
    0b01110000,
    0b10001000,
    0b10000000,
    0b10111000,
    0b10001000,
    0b10001000,
    0b01111000,

    // H (72)
    0b10001000,
    0b10001000,
    0b10001000,
    0b11111000,
    0b10001000,
    0b10001000,
    0b10001000,

    // I (73)
    0b01110000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b01110000,

    // J (74)
    0b00111000,
    0b00010000,
    0b00010000,
    0b00010000,
    0b00010000,
    0b10010000,
    0b01100000,

    // K (75)
    0b10001000,
    0b10010000,
    0b10100000,
    0b11000000,
    0b10100000,
    0b10010000,
    0b10001000,

    // L (76)
    0b10000000,
    0b10000000,
    0b10000000,
    0b10000000,
    0b10000000,
    0b10000000,
    0b11111000,

    // M (77)
    0b10001000,
    0b11011000,
    0b10101000,
    0b10101000,
    0b10001000,
    0b10001000,
    0b10001000,

    // N (78)
    0b10001000,
    0b10001000,
    0b11001000,
    0b10101000,
    0b10011000,
    0b10001000,
    0b10001000,

    // O (79)
    0b01110000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b01110000,

    // P (80)
    0b11110000,
    0b10001000,
    0b10001000,
    0b11110000,
    0b10000000,
    0b10000000,
    0b10000000,

    // Q (81)
    0b01110000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b10101000,
    0b10010000,
    0b01101000,

    // R (82)
    0b11110000,
    0b10001000,
    0b10001000,
    0b11110000,
    0b10100000,
    0b10010000,
    0b10001000,

    // S (83)
    0b01111000,
    0b10000000,
    0b10000000,
    0b01110000,
    0b00001000,
    0b00001000,
    0b11110000,

    // T (84)
    0b11111000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,

    // U (85)
    0b10001000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b01110000,

    // V (86)
    0b10001000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b01010000,
    0b00100000,

    // W (87)
    0b10001000,
    0b10001000,
    0b10001000,
    0b10101000,
    0b10101000,
    0b11011000,
    0b10001000,

    // X (88)
    0b10001000,
    0b10001000,
    0b01010000,
    0b00100000,
    0b01010000,
    0b10001000,
    0b10001000,

    // Y (89)
    0b10001000,
    0b10001000,
    0b01010000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,

    // Z (90)
    0b11111000,
    0b00001000,
    0b00010000,
    0b00100000,
    0b01000000,
    0b10000000,
    0b11111000,

    // [ (91)
    0b01110000,
    0b01000000,
    0b01000000,
    0b01000000,
    0b01000000,
    0b01000000,
    0b01110000,

    // \ (92)
    0b10000000,
    0b01000000,
    0b00100000,
    0b00010000,
    0b00001000,
    0b00000000,
    0b00000000,

    // ] (93)
    0b01110000,
    0b00010000,
    0b00010000,
    0b00010000,
    0b00010000,
    0b00010000,
    0b01110000,

    // ^ (94)
    0b00100000,
    0b01010000,
    0b10001000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,

    // _ (95)
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b11111000,

    // ` (96)
    0b01000000,
    0b00100000,
    0b00010000,
    0b00000000,
    0b00000000,
    0b00000000,
    0b00000000,

    // a (97)
    0b00000000,
    0b00000000,
    0b01110000,
    0b00001000,
    0b01111000,
    0b10001000,
    0b01111000,

    // b (98)
    0b10000000,
    0b10000000,
    0b10110000,
    0b11001000,
    0b10001000,
    0b10001000,
    0b11110000,

    // c (99)
    0b00000000,
    0b00000000,
    0b01110000,
    0b10000000,
    0b10000000,
    0b10001000,
    0b01110000,

    // d (100)
    0b00001000,
    0b00001000,
    0b01101000,
    0b10011000,
    0b10001000,
    0b10001000,
    0b01111000,

    // e (101)
    0b00000000,
    0b00000000,
    0b01110000,
    0b10001000,
    0b11111000,
    0b10000000,
    0b01110000,

    // f (102)
    0b00110000,
    0b01001000,
    0b01000000,
    0b11100000,
    0b01000000,
    0b01000000,
    0b01000000,

    // g (103)
    0b00000000,
    0b00000000,
    0b01111000,
    0b10001000,
    0b10001000,
    0b01111000,
    0b00001000,

    // h (104)
    0b10000000,
    0b10000000,
    0b10110000,
    0b11001000,
    0b10001000,
    0b10001000,
    0b10001000,

    // i (105)
    0b00100000,
    0b00000000,
    0b01100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b01110000,

    // j (106)
    0b00010000,
    0b00000000,
    0b00110000,
    0b00010000,
    0b00010000,
    0b10010000,
    0b01100000,

    // k (107)
    0b10000000,
    0b10000000,
    0b10010000,
    0b10100000,
    0b11000000,
    0b10100000,
    0b10010000,

    // l (108)
    0b01100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b01110000,

    // m (109)
    0b00000000,
    0b00000000,
    0b11010000,
    0b10101000,
    0b10101000,
    0b10101000,
    0b10101000,

    // n (110)
    0b00000000,
    0b00000000,
    0b10110000,
    0b11001000,
    0b10001000,
    0b10001000,
    0b10001000,

    // o (111)
    0b00000000,
    0b00000000,
    0b01110000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b01110000,

    // p (112)
    0b00000000,
    0b00000000,
    0b11110000,
    0b10001000,
    0b11110000,
    0b10000000,
    0b10000000,

    // q (113)
    0b00000000,
    0b00000000,
    0b01101000,
    0b10011000,
    0b01111000,
    0b00001000,
    0b00001000,

    // r (114)
    0b00000000,
    0b00000000,
    0b10110000,
    0b11001000,
    0b10000000,
    0b10000000,
    0b10000000,

    // s (115)
    0b00000000,
    0b00000000,
    0b01110000,
    0b10000000,
    0b01110000,
    0b00001000,
    0b11110000,

    // t (116)
    0b01000000,
    0b01000000,
    0b11100000,
    0b01000000,
    0b01000000,
    0b01001000,
    0b00110000,

    // u (117)
    0b00000000,
    0b00000000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b10011000,
    0b01101000,

    // v (118)
    0b00000000,
    0b00000000,
    0b10001000,
    0b10001000,
    0b10001000,
    0b01010000,
    0b00100000,

    // w (119)
    0b00000000,
    0b00000000,
    0b10001000,
    0b10001000,
    0b10101000,
    0b10101000,
    0b01010000,

    // x (120)
    0b00000000,
    0b00000000,
    0b10001000,
    0b01010000,
    0b00100000,
    0b01010000,
    0b10001000,

    // y (121)
    0b00000000,
    0b00000000,
    0b10001000,
    0b10001000,
    0b01111000,
    0b00001000,
    0b01110000,

    // z (122)
    0b00000000,
    0b00000000,
    0b11111000,
    0b00010000,
    0b00100000,
    0b01000000,
    0b11111000,

    // { (123)
    0b00110000,
    0b01000000,
    0b01000000,
    0b10000000,
    0b01000000,
    0b01000000,
    0b00110000,

    // | (124)
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,
    0b00100000,

    // } (125)
    0b11000000,
    0b00100000,
    0b00100000,
    0b00010000,
    0b00100000,
    0b00100000,
    0b11000000,

    // ~ (126)
    0b00000000,
    0b00000000,
    0b01010000,
    0b10101000,
    0b00000000,
    0b00000000,
    0b00000000
};

// Create a font atlas texture from the built-in pixel font data
FontAtlas* create_font_atlas(SDL_Renderer* renderer) {
    FontAtlas* atlas = (FontAtlas*)malloc(sizeof(FontAtlas));

    if (!atlas) {
        SDL_Log("Failed to allocate memory for font atlas");
        return NULL;
    }

    // Font specifications
    atlas->char_width = 5;
    atlas->char_height = 7;
    atlas->chars_per_row = 16; // 16 characters per row in the atlas texture
    atlas->char_count = 95;    // We support ASCII 32-126 (95 characters)
    atlas->first_char = 32;    // ASCII space character

    // Calculate atlas dimensions
    int rows = (atlas->char_count + atlas->chars_per_row - 1) / atlas->chars_per_row;
    int atlas_width = atlas->chars_per_row * atlas->char_width;
    int atlas_height = rows * atlas->char_height;

    // Create a surface for the atlas
    SDL_Surface* surface = SDL_CreateRGBSurface(0, atlas_width, atlas_height, 32,
                                             0xff000000, 0x00ff0000, 0x0000ff00, 0x000000ff);

    if (!surface) {
        SDL_Log("Failed to create surface for font atlas: %s", SDL_GetError());
        free(atlas);
        return NULL;
    }

    // Render each character to the atlas
    SDL_Rect dst_rect = {0, 0, atlas->char_width, atlas->char_height};

    // Fill the surface with transparent black
    SDL_FillRect(surface, NULL, SDL_MapRGBA(surface->format, 0, 0, 0, 0));

    // Lock the surface for pixel access
    SDL_LockSurface(surface);

    // For each character in our font data
    for (int c = 0; c < atlas->char_count; c++) {
        int char_row = c / atlas->chars_per_row;
        int char_col = c % atlas->chars_per_row;

        dst_rect.x = char_col * atlas->char_width;
        dst_rect.y = char_row * atlas->char_height;

        // Draw the character pixel by pixel
        for (int y = 0; y < atlas->char_height; y++) {
            unsigned char row_data = FONT_DATA[c * atlas->char_height + y];

            for (int x = 0; x < atlas->char_width; x++) {
                // Check if this pixel should be drawn (bit is set)
                if (row_data & (1 << (7 - x))) {
                    // Calculate pixel position
                    int pixel_x = dst_rect.x + x;
                    int pixel_y = dst_rect.y + y;

                    // Set pixel to white
                    Uint32* pixels = (Uint32*)surface->pixels;
                    pixels[pixel_y * surface->w + pixel_x] = SDL_MapRGBA(surface->format, 255, 255, 255, 255);
                }
            }
        }
    }

    SDL_UnlockSurface(surface);

    // Create texture from surface
    atlas->texture = SDL_CreateTextureFromSurface(renderer, surface);

    if (!atlas->texture) {
        SDL_Log("Failed to create texture for font atlas: %s", SDL_GetError());
        SDL_FreeSurface(surface);
        free(atlas);
        return NULL;
    }

    // Set the texture blend mode to support alpha blending
    SDL_SetTextureBlendMode(atlas->texture, SDL_BLENDMODE_BLEND);

    // Free the surface, we don't need it anymore
    SDL_FreeSurface(surface);

    return atlas;
}

void destroy_font_atlas(FontAtlas* atlas) {
    if (!atlas) return;

    if (atlas->texture) {
        SDL_DestroyTexture(atlas->texture);
        atlas->texture = NULL;
    }

    free(atlas);
}

// Calculate the pixel width of a text string when rendered
int measure_text_width(FontAtlas* atlas, const char* text, float scale) {
    if (!atlas || !text) return 0;

    int len = strlen(text);
    return len * atlas->char_width * scale;
}

// Render text using the font atlas
void render_text(SDL_Renderer* renderer, FontAtlas* atlas, const char* text,
                int x, int y, SDL_Color color, float scale) {
    if (!renderer || !atlas || !text) return;

    SDL_SetTextureColorMod(atlas->texture, color.r, color.g, color.b);
    SDL_SetTextureAlphaMod(atlas->texture, color.a);

    int len = strlen(text);
    int scaled_width = atlas->char_width * scale;
    int scaled_height = atlas->char_height * scale;

    SDL_Rect src_rect = {0, 0, atlas->char_width, atlas->char_height};
    SDL_Rect dst_rect = {x, y, scaled_width, scaled_height};

    for (int i = 0; i < len; i++) {
        char c = text[i];

        // Skip characters outside our supported range
        if (c < atlas->first_char || c >= atlas->first_char + atlas->char_count) {
            dst_rect.x += scaled_width;
            continue;
        }

        // Calculate the position of this character in the atlas
        int atlas_index = c - atlas->first_char;
        int row = atlas_index / atlas->chars_per_row;
        int col = atlas_index % atlas->chars_per_row;

        src_rect.x = col * atlas->char_width;
        src_rect.y = row * atlas->char_height;

        // Render the character
        SDL_RenderCopy(renderer, atlas->texture, &src_rect, &dst_rect);

        // Move to the next character position
        dst_rect.x += scaled_width;
    }
}

// Render text centered at a specific position
void render_text_centered(SDL_Renderer* renderer, FontAtlas* atlas, const char* text,
                        int x, int y, SDL_Color color, float scale) {
    if (!renderer || !atlas || !text) return;

    int text_width = measure_text_width(atlas, text, scale);
    int text_height = atlas->char_height * scale;

    // Calculate the position to center the text
    int start_x = x - text_width / 2;
    int start_y = y - text_height / 2;

    render_text(renderer, atlas, text, start_x, start_y, color, scale);
}

// Render text with a drop shadow for better visibility
void render_text_with_shadow(SDL_Renderer* renderer, FontAtlas* atlas, const char* text,
                           int x, int y, SDL_Color color, SDL_Color shadowColor,
                           int offsetX, int offsetY, float scale) {
    if (!renderer || !atlas || !text) return;

    // First render the shadow
    render_text(renderer, atlas, text, x + offsetX, y + offsetY, shadowColor, scale);

    // Then render the text on top
    render_text(renderer, atlas, text, x, y, color, scale);
}

// Render text wrapped to fit within a maximum width
void render_wrapped_text(SDL_Renderer* renderer, FontAtlas* atlas, const char* text,
                       int x, int y, int max_width, SDL_Color color, float scale) {
    if (!renderer || !atlas || !text) return;

    int len = strlen(text);
    const char* start = text;
    const char* end = text;
    int line_y = y;
    int char_width = atlas->char_width * scale;
    int char_height = atlas->char_height * scale;
    int line_spacing = char_height + 2;  // Add 2 pixels between lines

    while (*start) {
        int line_width = 0;
        const char* last_space = NULL;

        // Find where this line should end
        end = start;
        while (*end && line_width <= max_width) {
            if (*end == ' ') {
                last_space = end;
            }

            line_width += char_width;
            end++;
        }

        // If we exceeded the max width and found a space, break at the last space
        if (line_width > max_width && last_space) {
            end = last_space;
        }

        // Render this line
        char line_buffer[256];
        int line_len = end - start;
        if (line_len >= 256) line_len = 255;

        strncpy(line_buffer, start, line_len);
        line_buffer[line_len] = '\0';

        render_text(renderer, atlas, line_buffer, x, line_y, color, scale);

        // Move to the next line
        line_y += line_spacing;

        // Skip any spaces at the start of the next line
        start = end;
        if (*start == ' ') start++;
    }
}
