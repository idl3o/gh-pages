#include "font_atlas.h"
#include <SDL.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Basic mono-spaced font atlas implementation
// This creates a simple font atlas with a basic font for rendering text

FontAtlas* create_font_atlas(SDL_Renderer* renderer) {
    FontAtlas* atlas = (FontAtlas*)malloc(sizeof(FontAtlas));
    if (!atlas) {
        fprintf(stderr, "Failed to allocate memory for font atlas\n");
        return NULL;
    }

    // Initialize with default values
    atlas->char_width = 8;
    atlas->char_height = 12;
    atlas->chars_per_row = 16;
    atlas->atlas_width = atlas->char_width * atlas->chars_per_row;
    atlas->atlas_height = atlas->char_height * 8; // 128 characters / 16 per row = 8 rows

    // Create a blank texture for the font atlas
    atlas->texture = SDL_CreateTexture(
        renderer,
        SDL_PIXELFORMAT_RGBA8888,
        SDL_TEXTUREACCESS_TARGET,
        atlas->atlas_width,
        atlas->atlas_height
    );

    if (!atlas->texture) {
        fprintf(stderr, "Failed to create font atlas texture: %s\n", SDL_GetError());
        free(atlas);
        return NULL;
    }

    // Set blend mode for alpha blending
    SDL_SetTextureBlendMode(atlas->texture, SDL_BLENDMODE_BLEND);

    // Create a basic font (just simple shapes for each character)
    SDL_SetRenderTarget(renderer, atlas->texture);
    SDL_SetRenderDrawColor(renderer, 0, 0, 0, 0);
    SDL_RenderClear(renderer);
    SDL_SetRenderDrawColor(renderer, 255, 255, 255, 255);

    // Draw simple characters (just a basic grid pattern for now)
    for (int c = 0; c < 128; c++) {
        int row = c / atlas->chars_per_row;
        int col = c % atlas->chars_per_row;

        int x = col * atlas->char_width;
        int y = row * atlas->char_height;

        // Draw a simple box for each character
        SDL_Rect char_rect = {
            x + 1,
            y + 1,
            atlas->char_width - 2,
            atlas->char_height - 2
        };

        // Different patterns for different character ranges
        if (c >= 'A' && c <= 'Z') {
            // Capital letters: filled rectangle with a hole
            SDL_RenderFillRect(renderer, &char_rect);
            SDL_SetRenderDrawColor(renderer, 0, 0, 0, 0);
            SDL_Rect inner = {
                x + 3,
                y + 3,
                atlas->char_width - 6,
                atlas->char_height - 6
            };
            SDL_RenderFillRect(renderer, &inner);
            SDL_SetRenderDrawColor(renderer, 255, 255, 255, 255);
        }
        else if (c >= 'a' && c <= 'z') {
            // Lowercase letters: just the outline
            SDL_RenderDrawRect(renderer, &char_rect);
        }
        else if (c >= '0' && c <= '9') {
            // Numbers: diagonal line
            SDL_RenderDrawLine(renderer, x, y, x + atlas->char_width, y + atlas->char_height);
            SDL_RenderDrawLine(renderer, x, y + atlas->char_height, x + atlas->char_width, y);
        }
        else {
            // Other characters: simple dot
            SDL_Rect dot = {
                x + atlas->char_width/2 - 1,
                y + atlas->char_height/2 - 1,
                3,
                3
            };
            SDL_RenderFillRect(renderer, &dot);
        }
    }

    // Reset render target
    SDL_SetRenderTarget(renderer, NULL);

    return atlas;
}

void destroy_font_atlas(FontAtlas* atlas) {
    if (atlas) {
        if (atlas->texture) {
            SDL_DestroyTexture(atlas->texture);
        }
        free(atlas);
    }
}

void render_text(SDL_Renderer* renderer, FontAtlas* atlas, const char* text, int x, int y, SDL_Color color, float scale) {
    if (!atlas || !text) return;

    // Set the color modulation for the texture
    SDL_SetTextureColorMod(atlas->texture, color.r, color.g, color.b);
    SDL_SetTextureAlphaMod(atlas->texture, color.a);

    int len = strlen(text);
    int scaled_width = (int)(atlas->char_width * scale);
    int scaled_height = (int)(atlas->char_height * scale);

    for (int i = 0; i < len; i++) {
        char c = text[i];
        if (c < 0 || c >= 128) continue; // Skip non-ASCII chars

        int row = c / atlas->chars_per_row;
        int col = c % atlas->chars_per_row;

        SDL_Rect src = {
            col * atlas->char_width,
            row * atlas->char_height,
            atlas->char_width,
            atlas->char_height
        };

        SDL_Rect dst = {
            x + i * scaled_width,
            y,
            scaled_width,
            scaled_height
        };

        SDL_RenderCopy(renderer, atlas->texture, &src, &dst);
    }
}

void render_text_centered(SDL_Renderer* renderer, FontAtlas* atlas, const char* text, int x, int y, SDL_Color color, float scale) {
    if (!atlas || !text) return;

    int len = strlen(text);
    int text_width = (int)(len * atlas->char_width * scale);

    // Center text horizontally around the provided x coordinate
    render_text(renderer, atlas, text, x - text_width / 2, y, color, scale);
}
