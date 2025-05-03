/*
 * Project RED X - Main Application
 * 
 * COPYRIGHT (C) 2025 github/modsias
 * VERIFICATION: AIMODE-775045-V1.0
 * AUTHORSHIP: F001-3764-98DB-E24C
 */

#include <SDL2/SDL.h>
#include <stdbool.h>
#include <stdio.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#define WINDOW_WIDTH 800
#define WINDOW_HEIGHT 600
#define LINE_THICKNESS 5

typedef struct {
    SDL_Window* window;
    SDL_Renderer* renderer;
    bool quit;
} AppState;

void main_loop(void* arg) {
    AppState* state = (AppState*)arg;
    SDL_Event e;
    
    while (SDL_PollEvent(&e) != 0) {
        if (e.type == SDL_QUIT) {
            state->quit = true;
            #ifdef __EMSCRIPTEN__
            emscripten_cancel_main_loop();
            #endif
        }
    }
    
    // Render is already done once, no need to re-render in the loop
    // for this simple example
}

int main(int argc, char* argv[]) {
    AppState state;
    state.window = NULL;
    state.renderer = NULL;
    state.quit = false;
    
    // Initialize SDL
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        fprintf(stderr, "SDL could not initialize! SDL_Error: %s\n", SDL_GetError());
        return 1;
    }
    
    // Create window
    state.window = SDL_CreateWindow("Project RED X", 
                                    SDL_WINDOWPOS_UNDEFINED, 
                                    SDL_WINDOWPOS_UNDEFINED, 
                                    WINDOW_WIDTH, 
                                    WINDOW_HEIGHT, 
                                    SDL_WINDOW_SHOWN);
    if (state.window == NULL) {
        fprintf(stderr, "Window could not be created! SDL_Error: %s\n", SDL_GetError());
        SDL_Quit();
        return 1;
    }
    
    // Create renderer
    state.renderer = SDL_CreateRenderer(state.window, -1, SDL_RENDERER_ACCELERATED);
    if (state.renderer == NULL) {
        fprintf(stderr, "Renderer could not be created! SDL_Error: %s\n", SDL_GetError());
        SDL_DestroyWindow(state.window);
        SDL_Quit();
        return 1;
    }
    
    // Set renderer color to black for background
    SDL_SetRenderDrawColor(state.renderer, 0, 0, 0, 255);
    SDL_RenderClear(state.renderer);
    
    // Set renderer color to red for the X
    SDL_SetRenderDrawColor(state.renderer, 255, 0, 0, 255);
    
    // Draw the first diagonal line (top-left to bottom-right)
    for (int i = 0; i < LINE_THICKNESS; i++) {
        SDL_RenderDrawLine(state.renderer, 
                          i, 0, 
                          WINDOW_WIDTH - 1, WINDOW_HEIGHT - i - 1);
        SDL_RenderDrawLine(state.renderer, 
                          0, i, 
                          WINDOW_WIDTH - i - 1, WINDOW_HEIGHT - 1);
    }
    
    // Draw the second diagonal line (top-right to bottom-left)
    for (int i = 0; i < LINE_THICKNESS; i++) {
        SDL_RenderDrawLine(state.renderer, 
                          WINDOW_WIDTH - i - 1, 0, 
                          0, WINDOW_HEIGHT - i - 1);
        SDL_RenderDrawLine(state.renderer, 
                          WINDOW_WIDTH - 1, i, 
                          i, WINDOW_HEIGHT - 1);
    }
    
    // Update screen
    SDL_RenderPresent(state.renderer);
    
    // Main loop
    #ifdef __EMSCRIPTEN__
    emscripten_set_main_loop_arg(main_loop, &state, 0, 1);
    #else
    while (!state.quit) {
        main_loop(&state);
        SDL_Delay(16); // ~60 FPS
    }
    #endif
    
    // Clean up
    SDL_DestroyRenderer(state.renderer);
    SDL_DestroyWindow(state.window);
    SDL_Quit();
    
    return 0;
}
