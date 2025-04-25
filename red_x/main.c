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
#include <math.h>
#include <time.h>
#include <string.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#define WINDOW_WIDTH 800
#define WINDOW_HEIGHT 600
#define LINE_THICKNESS 5
#define MAX_PARTICLES 12
#define PI 3.14159265358979323846
#define NUM_COMMANDS 10

// Command definitions
typedef enum {
    CMD_INSTANCE_0,
    CMD_INSTANCE_1,
    CMD_INSTANCE_2,
    CMD_INSTANCE_3,
    CMD_INSTANCE_4,
    CMD_INSTANCE_5,
    CMD_INSTANCE_6,
    CMD_INSTANCE_7,
    CMD_INSTANCE_8,
    CMD_INSTANCE_9
} CommandType;

// Documentation structure
typedef struct {
    const char* title;
    const char* description;
    const char* file_path;
    const char* web_path;
} DocInfo;

typedef struct {
    float x;
    float y;
    float angle;
    float radius;
    float speed;
    SDL_Color color;
} Particle;

typedef struct {
    SDL_Window* window;
    SDL_Renderer* renderer;
    bool quit;
    Uint32 lastTime;
    float animTime;
    float pulseIntensity;
    bool pulseIncreasing;
    Particle particles[MAX_PARTICLES];
    SDL_Point hexagon[6];
    bool commandActive;
    int activeCommand;
    float commandTransition;
    SDL_Color bgColor;
    char statusMessage[256];
    Uint32 statusMessageTime;
    bool showDocInfo;
    int hoveredCommand;
} AppState;

// Command descriptions for display
const char* commandDescriptions[NUM_COMMANDS] = {
    "Instance 0: Main Portal",
    "Instance 1: Content Explorer",
    "Instance 2: Contract Viewer",
    "Instance 3: Governance Portal",
    "Instance 4: Creator Dashboard",
    "Instance 5: Security Analytics",
    "Instance 6: Documentation Hub",
    "Instance 7: Streaming Service",
    "Instance 8: Token Explorer",
    "Instance 9: Developer Console"
};

// Documentation information for each instance
const DocInfo instanceDocs[NUM_COMMANDS] = {
    {
        "Main Portal",
        "Gateway to Web3 streaming platform",
        "../README.md",
        "https://github.com/username/gh-pages/blob/main/README.md"
    },
    {
        "Content Explorer",
        "Browse web3 streaming content",
        "../creators.md",
        "https://github.com/username/gh-pages/blob/main/creators.md"
    },
    {
        "Contract Viewer",
        "Review smart contract specifications",
        "../docs/contracts/index.md",
        "https://github.com/username/gh-pages/blob/main/docs/contracts/index.md"
    },
    {
        "Governance Portal",
        "Participate in platform governance",
        "../governance-visualization.html",
        "https://github.com/username/gh-pages/blob/main/governance-visualization.html"
    },
    {
        "Creator Dashboard",
        "Manage your creator profile",
        "../creator-dashboard.html",
        "https://github.com/username/gh-pages/blob/main/creator-dashboard.html"
    },
    {
        "Security Analytics",
        "Platform security information",
        "../SECURITY.md",
        "https://github.com/username/gh-pages/blob/main/SECURITY.md"
    },
    {
        "Documentation Hub",
        "Complete platform documentation",
        "../docs.html",
        "https://github.com/username/gh-pages/blob/main/docs.html"
    },
    {
        "Streaming Service",
        "Web3 content streaming mechanisms",
        "../streaming.html",
        "https://github.com/username/gh-pages/blob/main/streaming.html"
    },
    {
        "Token Explorer",
        "Explore platform cryptocurrency tokens",
        "../token.html",
        "https://github.com/username/gh-pages/blob/main/token.html"
    },
    {
        "Developer Console",
        "Developer tools and API documentation",
        "../CONTRIBUTING.md",
        "https://github.com/username/gh-pages/blob/main/CONTRIBUTING.md"
    }
};

// Utility function to convert HSV to RGB
SDL_Color hsv_to_rgb(float h, float s, float v) {
    SDL_Color rgb;
    float r, g, b;

    int i = floor(h * 6);
    float f = h * 6 - i;
    float p = v * (1 - s);
    float q = v * (1 - f * s);
    float t = v * (1 - (1 - f) * s);

    switch(i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }

    rgb.r = r * 255;
    rgb.g = g * 255;
    rgb.b = b * 255;
    rgb.a = 255;

    return rgb;
}

void init_particles(AppState* state) {
    srand(time(NULL));

    for (int i = 0; i < MAX_PARTICLES; i++) {
        state->particles[i].radius = 30.0f + (rand() % 20);
        state->particles[i].angle = (float)(rand() % 360) * PI / 180.0f;
        float dist = 100.0f + (rand() % 200);
        state->particles[i].x = WINDOW_WIDTH / 2 + cos(state->particles[i].angle) * dist;
        state->particles[i].y = WINDOW_HEIGHT / 2 + sin(state->particles[i].angle) * dist;
        state->particles[i].speed = 0.2f + ((float)rand() / RAND_MAX) * 0.5f;
        float hue = (float)i / MAX_PARTICLES;
        state->particles[i].color = hsv_to_rgb(hue, 0.7f, 1.0f);
    }
}

void draw_hexagon(SDL_Renderer* renderer, int cx, int cy, int size, SDL_Color color) {
    SDL_Point points[7];

    for (int i = 0; i < 6; i++) {
        float angle_rad = PI / 3.0f * i;
        points[i].x = cx + size * cos(angle_rad);
        points[i].y = cy + size * sin(angle_rad);
    }
    points[6] = points[0]; // Close the shape

    SDL_SetRenderDrawColor(renderer, color.r, color.g, color.b, color.a);
    for (int i = 0; i < 6; i++) {
        SDL_RenderDrawLine(renderer, points[i].x, points[i].y, points[i+1].x, points[i+1].y);
    }
}

void update_particles(AppState* state, float deltaTime) {
    for (int i = 0; i < MAX_PARTICLES; i++) {
        state->particles[i].angle += state->particles[i].speed * deltaTime;
        if (state->particles[i].angle > 2 * PI) {
            state->particles[i].angle -= 2 * PI;
        }

        float dist = 100.0f + 50.0f * sin(state->animTime * 0.5f + i);
        state->particles[i].x = WINDOW_WIDTH / 2 + cos(state->particles[i].angle) * dist;
        state->particles[i].y = WINDOW_HEIGHT / 2 + sin(state->particles[i].angle) * dist;

        // Update color with time
        float hue = (float)i / MAX_PARTICLES + state->animTime * 0.1f;
        if (hue > 1.0f) hue -= 1.0f;
        state->particles[i].color = hsv_to_rgb(hue, 0.7f, 1.0f);
    }
}

void draw_x(AppState* state, float intensity) {
    // Set renderer color to red for the X with intensity
    int redValue = 128 + (int)(127.0f * intensity);
    SDL_SetRenderDrawColor(state->renderer, redValue, 0, 0, 255);

    // Draw the first diagonal line (top-left to bottom-right)
    for (int i = 0; i < LINE_THICKNESS; i++) {
        SDL_RenderDrawLine(state->renderer,
                          i, 0,
                          WINDOW_WIDTH - 1, WINDOW_HEIGHT - i - 1);
        SDL_RenderDrawLine(state->renderer,
                          0, i,
                          WINDOW_WIDTH - i - 1, WINDOW_HEIGHT - 1);
    }

    // Draw the second diagonal line (top-right to bottom-left)
    for (int i = 0; i < LINE_THICKNESS; i++) {
        SDL_RenderDrawLine(state->renderer,
                          WINDOW_WIDTH - i - 1, 0,
                          0, WINDOW_HEIGHT - i - 1);
        SDL_RenderDrawLine(state->renderer,
                          WINDOW_WIDTH - 1, i,
                          i, WINDOW_HEIGHT - 1);
    }
}

// Set a status message to display
void set_status_message(AppState* state, const char* message) {
    strcpy(state->statusMessage, message);
    state->statusMessageTime = SDL_GetTicks();
}

// Launch documentation for a specific instance
void launch_documentation(int instanceId) {
    const DocInfo* doc = &instanceDocs[instanceId];

    // Different approaches for different platforms
    #ifdef _WIN32
    // For Windows
    char command[512];
    #ifdef __EMSCRIPTEN__
    // If in browser, provide a link
    EM_ASM_({
        window.open(UTF8ToString($0), '_blank');
    }, doc->web_path);
    #else
    // Native Windows version
    sprintf(command, "start %s", doc->file_path);
    system(command);
    #endif
    #elif defined(__APPLE__)
    // For macOS
    char command[512];
    sprintf(command, "open %s", doc->file_path);
    system(command);
    #elif defined(__linux__)
    // For Linux
    char command[512];
    sprintf(command, "xdg-open %s", doc->file_path);
    system(command);
    #endif

    printf("Launching documentation: %s (%s)\n", doc->title, doc->file_path);
}

// Execute the command associated with a key
void execute_command(AppState* state, int commandNum) {
    if (commandNum >= 0 && commandNum < NUM_COMMANDS) {
        state->commandActive = true;
        state->activeCommand = commandNum;
        state->commandTransition = 0.0f;

        // Set the status message with the command description
        char message[256];
        sprintf(message, "Activating %s - %s",
                commandDescriptions[commandNum],
                instanceDocs[commandNum].description);
        set_status_message(state, message);

        // Optional: Set a specific color for each command
        float hue = (float)commandNum / NUM_COMMANDS;
        SDL_Color color = hsv_to_rgb(hue, 0.3f, 0.2f);
        state->bgColor = color;

        printf("Command %d activated: %s\n", commandNum, commandDescriptions[commandNum]);

        // Launch documentation for this instance
        launch_documentation(commandNum);
    }
}

// Draw information panel with command docs
void draw_doc_info(AppState* state, int commandId) {
    if (commandId < 0 || commandId >= NUM_COMMANDS) return;

    // Define doc info area
    SDL_Rect rect = {WINDOW_WIDTH / 2 - 200, WINDOW_HEIGHT / 2 - 100, 400, 180};

    // Draw semi-transparent background
    SDL_SetRenderDrawColor(state->renderer, 0, 0, 30, 200);
    SDL_SetRenderDrawBlendMode(state->renderer, SDL_BLENDMODE_BLEND);
    SDL_RenderFillRect(state->renderer, &rect);

    // Draw border
    SDL_SetRenderDrawColor(state->renderer, 100, 100, 255, 255);
    SDL_RenderDrawRect(state->renderer, &rect);
    SDL_SetRenderDrawBlendMode(state->renderer, SDL_BLENDMODE_NONE);

    // Note: In a real implementation with proper font rendering,
    // you would display the following information from instanceDocs[commandId]:
    // - Title
    // - Description
    // - Instructions to press the key to access documentation

    // Instead, we'll draw visual placeholders for text
    SDL_Rect titleLine = {rect.x + 20, rect.y + 20, 360, 3};
    SDL_Rect descLine1 = {rect.x + 20, rect.y + 40, 300, 2};
    SDL_Rect descLine2 = {rect.x + 20, rect.y + 55, 280, 2};
    SDL_Rect instLine1 = {rect.x + 20, rect.y + 85, 320, 2};
    SDL_Rect instLine2 = {rect.x + 20, rect.y + 100, 250, 2};

    // Use color based on command
    float hue = (float)commandId / NUM_COMMANDS;
    SDL_Color color = hsv_to_rgb(hue, 0.7f, 1.0f);
    SDL_SetRenderDrawColor(state->renderer, color.r, color.g, color.b, 255);

    // Draw "text" lines
    SDL_RenderFillRect(state->renderer, &titleLine);
    SDL_RenderFillRect(state->renderer, &descLine1);
    SDL_RenderFillRect(state->renderer, &descLine2);

    SDL_SetRenderDrawColor(state->renderer, 200, 200, 200, 255);
    SDL_RenderFillRect(state->renderer, &instLine1);
    SDL_RenderFillRect(state->renderer, &instLine2);
}

// Draw the interface for keyboard commands
void draw_commands(AppState* state) {
    // Define text area
    SDL_Rect rect = {10, WINDOW_HEIGHT - 40, WINDOW_WIDTH - 20, 30};

    // Draw semi-transparent background for text
    SDL_SetRenderDrawColor(state->renderer, 0, 0, 0, 180);
    SDL_SetRenderDrawBlendMode(state->renderer, SDL_BLENDMODE_BLEND);
    SDL_RenderFillRect(state->renderer, &rect);
    SDL_SetRenderDrawBlendMode(state->renderer, SDL_BLENDMODE_NONE);

    // Draw key outlines
    for (int i = 0; i < NUM_COMMANDS; i++) {
        SDL_Rect keyRect = {20 + i * 30, WINDOW_HEIGHT - 35, 25, 25};

        // Determine key color based on state
        if (state->commandActive && state->activeCommand == i) {
            // Active key
            SDL_SetRenderDrawColor(state->renderer, 255, 255, 0, 255);
        } else if (state->hoveredCommand == i) {
            // Hovered key
            SDL_SetRenderDrawColor(state->renderer, 200, 200, 0, 255);
        } else {
            // Normal key
            SDL_SetRenderDrawColor(state->renderer, 100, 100, 100, 255);
        }

        SDL_RenderDrawRect(state->renderer, &keyRect);

        // Draw key number
        char key_text[2] = {'0' + i, '\0'};
        SDL_Rect textRect = {keyRect.x + 8, keyRect.y + 5, 0, 0}; // Position for text

        // In a real implementation with proper font rendering,
        // you would render the key_text string here
        // Since we don't have font rendering, just draw a simple indicator
        if (i == 0) {
            // Special indicator for key 0
            SDL_Rect zeroRect = {keyRect.x + 10, keyRect.y + 10, 5, 5};
            SDL_RenderFillRect(state->renderer, &zeroRect);
        } else {
            // Indicators for keys 1-9
            int lines = (i < 4) ? i : (i % 3 + 1);
            for (int j = 0; j < lines; j++) {
                SDL_Rect lineRect = {keyRect.x + 7, keyRect.y + 7 + j * 4, 11, 2};
                SDL_RenderFillRect(state->renderer, &lineRect);
            }
        }
    }

    // Draw status message if it's recent (within last 3 seconds)
    Uint32 currentTime = SDL_GetTicks();
    if (currentTime - state->statusMessageTime < 3000 && strlen(state->statusMessage) > 0) {
        SDL_Rect msgRect = {WINDOW_WIDTH / 2 - 200, 20, 400, 30};
        SDL_SetRenderDrawColor(state->renderer, 0, 0, 0, 180);
        SDL_SetRenderDrawBlendMode(state->renderer, SDL_BLENDMODE_BLEND);
        SDL_RenderFillRect(state->renderer, &msgRect);
        SDL_SetRenderDrawBlendMode(state->renderer, SDL_BLENDMODE_NONE);

        // Draw border around message
        SDL_SetRenderDrawColor(state->renderer, 255, 255, 255, 255);
        SDL_RenderDrawRect(state->renderer, &msgRect);
    }

    // Show documentation info panel for hovered command if enabled
    if (state->showDocInfo && state->hoveredCommand >= 0) {
        draw_doc_info(state, state->hoveredCommand);
    }
}

void main_loop(void* arg) {
    AppState* state = (AppState*)arg;
    SDL_Event e;

    // Track mouse position for hovering
    int mouseX, mouseY;
    SDL_GetMouseState(&mouseX, &mouseY);

    // Check if mouse is hovering over a command key
    state->hoveredCommand = -1; // Reset hover state
    if (mouseY > WINDOW_HEIGHT - 40) {
        for (int i = 0; i < NUM_COMMANDS; i++) {
            SDL_Rect keyRect = {20 + i * 30, WINDOW_HEIGHT - 35, 25, 25};
            if (mouseX >= keyRect.x && mouseX < keyRect.x + keyRect.w &&
                mouseY >= keyRect.y && mouseY < keyRect.y + keyRect.h) {
                state->hoveredCommand = i;
                break;
            }
        }
    }

    while (SDL_PollEvent(&e) != 0) {
        if (e.type == SDL_QUIT) {
            state->quit = true;
            #ifdef __EMSCRIPTEN__
            emscripten_cancel_main_loop();
            #endif
        }
        else if (e.type == SDL_KEYDOWN) {
            if (e.key.keysym.sym >= SDLK_0 && e.key.keysym.sym <= SDLK_9) {
                int num;
                if (e.key.keysym.sym == SDLK_0) {
                    num = 0;
                } else {
                    num = e.key.keysym.sym - SDLK_1 + 1;
                }
                execute_command(state, num);
            }
            else if (e.key.keysym.sym == SDLK_h || e.key.keysym.sym == SDLK_F1) {
                // Toggle documentation info display with H or F1
                state->showDocInfo = !state->showDocInfo;
                if (state->showDocInfo) {
                    set_status_message(state, "Documentation info enabled - hover over keys to see details");
                } else {
                    set_status_message(state, "Documentation info disabled");
                }
            }
        }
        else if (e.type == SDL_MOUSEBUTTONDOWN) {
            if (e.button.button == SDL_BUTTON_LEFT) {
                // Handle clicks on command keys
                if (state->hoveredCommand >= 0) {
                    execute_command(state, state->hoveredCommand);
                }
            }
        }
    }

    // Calculate delta time
    Uint32 currentTime = SDL_GetTicks();
    float deltaTime = (currentTime - state->lastTime) / 1000.0f;
    state->lastTime = currentTime;

    // Update animation time
    state->animTime += deltaTime;

    // Update command transition if active
    if (state->commandActive) {
        state->commandTransition += deltaTime * 0.5f;
        if (state->commandTransition >= 1.0f) {
            // In a real app, this is where you'd transition to the actual instance
            state->commandTransition = 1.0f;
        }
    }

    // Update pulse effect
    if (state->pulseIncreasing) {
        state->pulseIntensity += deltaTime * 0.8f;
        if (state->pulseIntensity >= 1.0f) {
            state->pulseIntensity = 1.0f;
            state->pulseIncreasing = false;
        }
    } else {
        state->pulseIntensity -= deltaTime * 0.8f;
        if (state->pulseIntensity <= 0.3f) {
            state->pulseIntensity = 0.3f;
            state->pulseIncreasing = true;
        }
    }

    // Update particles
    update_particles(state, deltaTime);

    // Clear screen with background color (may be modified by command)
    if (state->commandActive) {
        SDL_SetRenderDrawColor(state->renderer,
                              state->bgColor.r,
                              state->bgColor.g,
                              state->bgColor.b,
                              255);
    } else {
        SDL_SetRenderDrawColor(state->renderer, 0, 0, 0, 255);
    }
    SDL_RenderClear(state->renderer);

    // Draw particles (hexagons)
    for (int i = 0; i < MAX_PARTICLES; i++) {
        Particle* p = &state->particles[i];
        draw_hexagon(state->renderer, (int)p->x, (int)p->y, (int)p->radius, p->color);
    }

    // Draw the X with pulsating intensity
    draw_x(state, state->pulseIntensity);

    // Draw the command interface
    draw_commands(state);

    // Update screen
    SDL_RenderPresent(state->renderer);
}

int main(int argc, char* argv[]) {
    AppState state;
    state.window = NULL;
    state.renderer = NULL;
    state.quit = false;
    state.lastTime = SDL_GetTicks();
    state.animTime = 0.0f;
    state.pulseIntensity = 0.5f;
    state.pulseIncreasing = true;
    state.commandActive = false;
    state.activeCommand = -1;
    state.commandTransition = 0.0f;
    state.bgColor.r = 0;
    state.bgColor.g = 0;
    state.bgColor.b = 0;
    state.bgColor.a = 255;
    state.statusMessage[0] = '\0';
    state.statusMessageTime = 0;
    state.showDocInfo = false;
    state.hoveredCommand = -1;

    // Initialize SDL
    if (SDL_Init(SDL_INIT_VIDEO) < 0) {
        fprintf(stderr, "SDL could not initialize! SDL_Error: %s\n", SDL_GetError());
        return 1;
    }

    // Create window
    state.window = SDL_CreateWindow("Project RED X - Gateway",
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

    // Initialize particles
    init_particles(&state);

    // Display initial help message
    set_status_message(&state, "Press keys 0-9 to access instances, press H for documentation info");

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
