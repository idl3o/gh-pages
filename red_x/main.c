/*
 * Project RED X - Main Application
 *
 * COPYRIGHT (C) 2025 github/modsias
 * VERIFICATION: AIMODE-775045-V1.0
 * AUTHORSHIP: F001-3764-98DB-E24C
 */

#include <SDL.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <math.h>
#include <time.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

#include "font_atlas.h"

// Window dimensions
#define WINDOW_WIDTH 800
#define WINDOW_HEIGHT 600

// Maximum particles to render
#define MAX_PARTICLES 100

// Hexagon parameters
#define HEX_RADIUS 15

// Center X logo dimensions
#define X_SIZE 70
#define X_THICKNESS 12
#define X_PULSE_SPEED 0.03

// Particle interaction parameters
#define INTERACTION_DISTANCE 100.0f
#define REPULSION_STRENGTH 0.15f
#define ATTRACTION_STRENGTH 0.05f
#define MAX_SPEED 1.0f
#define MIN_ORBIT_RADIUS 80.0f
#define MAX_ORBIT_RADIUS 300.0f
#define MOUSE_INFLUENCE_RADIUS 150.0f
#define MOUSE_REPULSION_STRENGTH 0.8f
#define PARTICLE_TRAIL_LENGTH 5
#define CONNECTED_NODES_MAX 3

// New feature: Node creation and search parameters
#define CREATION_COOLDOWN 1.0f // Time between node creations
#define MAX_SEARCH_RESULTS 10
#define STATISTICS_UPDATE_INTERVAL 1.0f // Update stats once per second

// Context menu parameters
#define CONTEXT_MENU_WIDTH 200
#define CONTEXT_MENU_ITEM_HEIGHT 30
#define CONTEXT_MENU_PADDING 5
#define CONTEXT_MENU_MAX_ITEMS 6

// Application modes
typedef enum
{
    MODE_NORMAL,
    MODE_CREATION,
    MODE_SEARCH,
    MODE_RENAME // New mode for renaming nodes
} AppMode;

// Network statistics
typedef struct
{
    int nodes_by_type[10];
    int total_connections;
    int average_connections;
    float network_density;
    int most_connected_node;
    float update_timer;
} NetworkStats;

// Definition for a hexagonal particle
typedef struct
{
    float x, y;                               // Position
    float orbit_radius;                       // Distance from center
    float angle;                              // Current angle in radians
    float speed;                              // Orbital speed
    float vx, vy;                             // Velocity components for interactions
    SDL_Color color;                          // Color
    bool active;                              // Whether the particle is active
    int type;                                 // Particle type (0-9)
    char data[64];                            // Associated data/metadata
    bool highlighted;                         // Whether this particle is highlighted
    float energy;                             // Energy level (for visual effects)
    int connected_nodes[CONNECTED_NODES_MAX]; // IDs of connected nodes
    int connection_count;                     // Number of connected nodes
    float trail_x[PARTICLE_TRAIL_LENGTH];     // Trail positions X
    float trail_y[PARTICLE_TRAIL_LENGTH];     // Trail positions Y
} Particle;

// Application environment types
typedef enum
{
    ENV_UNKNOWN,
    ENV_BROWSER,
    ENV_POWERSHELL,
    ENV_CMD,
    ENV_BASH
} AppEnvironment;

// Application state
typedef struct
{
    bool running;
    SDL_Window *window;
    SDL_Renderer *renderer;
    Particle particles[MAX_PARTICLES];
    int active_particles;
    float pulse_state;
    int selected_instance;
    FontAtlas *font;            // Font atlas for text rendering
    float hover_alpha;          // Alpha for hover information
    int hover_particle;         // Which particle is being hovered over
    bool show_docs;             // Whether to show documentation panel
    int mouse_x;                // Current mouse X position
    int mouse_y;                // Current mouse Y position
    bool mouse_active;          // Whether mouse is influencing particles
    bool interaction_mode;      // Whether particle interaction is enabled
    int selected_particle;      // Currently selected particle (-1 if none)
    float interaction_strength; // Strength of interactions
    Uint32 last_update_time;    // Time of last update

    // Environment detection
    AppEnvironment environment;   // Current detected environment
    bool environment_initialized; // Whether environment has been detected
    char env_display_name[64];    // Human-readable environment name

    // New feature: App mode and related features
    AppMode mode;                           // Current application mode
    float creation_cooldown;                // Cooldown timer for creating nodes
    int creation_type;                      // Type of node being created (0-9)
    char search_term[64];                   // Current search term
    int search_results[MAX_SEARCH_RESULTS]; // Array of search result indices
    int search_count;                       // Number of search results
    bool show_stats;                        // Whether to show statistics panel
    NetworkStats stats;                     // Network statistics
    bool stats_panel_visible;               // Whether the stats panel is visible

    // Dragging feature variables
    bool dragging;        // Whether currently dragging a particle
    int dragged_particle; // Index of the particle being dragged
    float drag_offset_x;  // Offset from mouse to particle center (X)
    float drag_offset_y;  // Offset from mouse to particle center (Y)

    // Rename feature variables
    int rename_particle;    // Particle being renamed (-1 if none)
    char rename_buffer[64]; // Buffer for the new name being typed

    // Context menu feature variables
    bool show_context_menu;    // Whether to show the context menu
    int context_menu_particle; // Particle that the context menu is for
    int context_menu_x;        // X position of the context menu
    int context_menu_y;        // Y position of the context menu

    // Filter visualization feature variables
    bool filter_active;    // Whether filtering is active
    bool filter_types[10]; // Which node types to show (true) or hide (false)
    bool show_filter_ui;   // Whether to show the filter UI
} AppState;

// Forward declarations for functions used before they're defined
void draw_docs_panel(AppState *state);
void draw_statistics_panel(AppState *state);
void draw_creation_mode_ui(AppState *state);
void draw_search_mode_ui(AppState *state);
void draw_rename_mode_ui(AppState *state);
void draw_context_menu(AppState *state);
void draw_filter_ui(AppState *state);
void search_particles(AppState *state, const char *search_term);
void calculate_network_stats(AppState *state, float delta_time);
int create_new_particle(AppState *state, int type, float x, float y);
void detect_environment(AppState *state);
void update(AppState *state);
void apply_particle_interaction(AppState *state, float delta_time);

// Case insensitive substring search for platforms that may not have strcasestr
char *strcasestr(const char *haystack, const char *needle)
{
    if (!haystack || !needle)
        return NULL;

    size_t needle_len = strlen(needle);
    if (needle_len == 0)
        return (char *)haystack;

    size_t haystack_len = strlen(haystack);
    if (haystack_len < needle_len)
        return NULL;

    for (size_t i = 0; i <= haystack_len - needle_len; i++)
    {
        if (strncasecmp(&haystack[i], needle, needle_len) == 0)
        {
            return (char *)&haystack[i];
        }
    }

    return NULL;
}

// Cross-platform case insensitive string comparison
int strncasecmp(const char *s1, const char *s2, size_t n)
{
    if (n == 0)
        return 0;

    do
    {
        int c1 = tolower((unsigned char)*s1++);
        int c2 = tolower((unsigned char)*s2++);
        if (c1 != c2)
            return c1 - c2;
        if (c1 == 0)
            break;
    } while (--n > 0);

    return 0;
}

// Initialize the application
void initialize(AppState *state)
{
    // Initialize SDL
    if (SDL_Init(SDL_INIT_VIDEO) < 0)
    {
        printf("SDL could not initialize! SDL_Error: %s\n", SDL_GetError());
        exit(1);
    }

    // Create window
    state->window = SDL_CreateWindow(
        "Project RED X Gateway",
        SDL_WINDOWPOS_UNDEFINED, SDL_WINDOWPOS_UNDEFINED,
        WINDOW_WIDTH, WINDOW_HEIGHT,
        SDL_WINDOW_SHOWN);

    if (!state->window)
    {
        printf("Window could not be created! SDL_Error: %s\n", SDL_GetError());
        SDL_Quit();
        exit(1);
    }

    // Create renderer
    state->renderer = SDL_CreateRenderer(state->window, -1, SDL_RENDERER_ACCELERATED);
    if (!state->renderer)
    {
        printf("Renderer could not be created! SDL_Error: %s\n", SDL_GetError());
        SDL_DestroyWindow(state->window);
        SDL_Quit();
        exit(1);
    }

    // Initialize application state
    state->running = true;
    state->active_particles = 0;
    state->pulse_state = 0.0f;
    state->selected_instance = 0;
    state->hover_alpha = 0.0f;
    state->hover_particle = -1;
    state->show_docs = false;
    state->mouse_active = false;
    state->interaction_mode = true; // Enable interactions by default
    state->selected_particle = -1;
    state->interaction_strength = 1.0f;
    state->last_update_time = SDL_GetTicks();
    state->mouse_x = WINDOW_WIDTH / 2;
    state->mouse_y = WINDOW_HEIGHT / 2;

    // Initialize dragging state
    state->dragging = false;
    state->dragged_particle = -1;
    state->drag_offset_x = 0.0f;
    state->drag_offset_y = 0.0f;

    // Initialize environment detection fields
    state->environment = ENV_UNKNOWN;
    state->environment_initialized = false;
    strcpy(state->env_display_name, "");

    // Initialize rename feature variables
    state->rename_particle = -1;
    memset(state->rename_buffer, 0, sizeof(state->rename_buffer));

    // Initialize context menu variables
    state->show_context_menu = false;
    state->context_menu_particle = -1;

    // Initialize filter visualization variables
    state->filter_active = false;
    state->show_filter_ui = false;
    for (int i = 0; i < 10; i++)
    {
        state->filter_types[i] = true; // Initially show all types
    }

    // New feature: Initialize mode and related features
    state->mode = MODE_NORMAL;
    state->creation_cooldown = 0.0f;
    state->creation_type = 0;
    memset(state->search_term, 0, sizeof(state->search_term));
    memset(state->search_results, -1, sizeof(state->search_results));
    state->search_count = 0;
    state->show_stats = false;
    memset(&state->stats, 0, sizeof(NetworkStats));
    state->stats_panel_visible = false;

    // Create font atlas for text rendering
    state->font = create_font_atlas(state->renderer);
    if (!state->font)
    {
        printf("Failed to create font atlas!\n");
    }

    // Initialize random seed
    srand((unsigned int)time(NULL));

    // Initialize particles
    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        if (i < 30)
        { // Only activate 30 particles initially
            state->particles[i].active = true;
            state->particles[i].orbit_radius = 100.0f + (rand() % 150);
            state->particles[i].angle = (float)(rand() % 628) / 100.0f; // 0 to 2π
            state->particles[i].speed = 0.2f + ((float)rand() / RAND_MAX) * 0.5f;
            state->particles[i].type = rand() % 10; // 0-9 different types
            state->particles[i].vx = 0.0f;
            state->particles[i].vy = 0.0f;
            state->particles[i].highlighted = false;
            state->particles[i].energy = 0.0f;
            state->particles[i].connection_count = 0;

            // Initialize trail positions
            for (int t = 0; t < PARTICLE_TRAIL_LENGTH; t++)
            {
                state->particles[i].trail_x[t] = 0;
                state->particles[i].trail_y[t] = 0;
            }

            // Color based on type
            switch (state->particles[i].type)
            {
            case 0:
                state->particles[i].color = (SDL_Color){255, 100, 100, 255}; // Red
                sprintf(state->particles[i].data, "Core Node %d", i);
                break;
            case 1:
                state->particles[i].color = (SDL_Color){100, 255, 100, 255}; // Green
                sprintf(state->particles[i].data, "Validator %d", i);
                break;
            case 2:
                state->particles[i].color = (SDL_Color){100, 100, 255, 255}; // Blue
                sprintf(state->particles[i].data, "Storage %d", i);
                break;
            case 3:
                state->particles[i].color = (SDL_Color){255, 255, 100, 255}; // Yellow
                sprintf(state->particles[i].data, "Gateway %d", i);
                break;
            case 4:
                state->particles[i].color = (SDL_Color){255, 100, 255, 255}; // Magenta
                sprintf(state->particles[i].data, "Oracle %d", i);
                break;
            case 5:
                state->particles[i].color = (SDL_Color){100, 255, 255, 255}; // Cyan
                sprintf(state->particles[i].data, "Bridge %d", i);
                break;
            case 6:
                state->particles[i].color = (SDL_Color){255, 150, 50, 255}; // Orange
                sprintf(state->particles[i].data, "Relay %d", i);
                break;
            case 7:
                state->particles[i].color = (SDL_Color){150, 100, 200, 255}; // Purple
                sprintf(state->particles[i].data, "Archive %d", i);
                break;
            case 8:
                state->particles[i].color = (SDL_Color){100, 200, 150, 255}; // Teal
                sprintf(state->particles[i].data, "Identity %d", i);
                break;
            case 9:
                state->particles[i].color = (SDL_Color){200, 200, 200, 255}; // Light gray
                sprintf(state->particles[i].data, "Client %d", i);
                break;
            }

            state->active_particles++;
        }
        else
        {
            state->particles[i].active = false;
        }
    }

    // Create some initial connections between particles
    for (int i = 0; i < 10; i++)
    {                         // Create 10 random connections
        int p1 = rand() % 30; // Random index between 0 and 29
        int p2 = rand() % 30;

        // Don't connect to self
        if (p1 == p2)
            continue;

        // Add connection if there's room
        if (state->particles[p1].connection_count < CONNECTED_NODES_MAX)
        {
            state->particles[p1].connected_nodes[state->particles[p1].connection_count++] = p2;
        }
        if (state->particles[p2].connection_count < CONNECTED_NODES_MAX)
        {
            state->particles[p2].connected_nodes[state->particles[p2].connection_count++] = p1;
        }
    }
}

// Clean up and exit
void cleanup(AppState *state)
{
    // Clean up font atlas
    if (state->font)
    {
        destroy_font_atlas(state->font);
    }

    // Clean up SDL
    SDL_DestroyRenderer(state->renderer);
    SDL_DestroyWindow(state->window);
    SDL_Quit();
}

// Draw a hexagon
void draw_hexagon(SDL_Renderer *renderer, int x, int y, int radius, SDL_Color color)
{
    const int vertices = 6;
    int vx[vertices], vy[vertices];

    // Calculate vertices
    for (int i = 0; i < vertices; i++)
    {
        float angle = M_PI / 3.0f * i; // 60 degrees per vertex
        vx[i] = x + (int)(radius * cos(angle));
        vy[i] = y + (int)(radius * sin(angle));
    }

    // Set color
    SDL_SetRenderDrawColor(renderer, color.r, color.g, color.b, color.a);

    // Draw lines between vertices
    for (int i = 0; i < vertices; i++)
    {
        int next = (i + 1) % vertices;
        SDL_RenderDrawLine(renderer, vx[i], vy[i], vx[next], vy[next]);
    }
}

// Draw a filled hexagon
void draw_filled_hexagon(SDL_Renderer *renderer, int x, int y, int radius, SDL_Color color)
{
    const int vertices = 6;
    int vx[vertices], vy[vertices];

    // Calculate vertices
    for (int i = 0; i < vertices; i++)
    {
        float angle = M_PI / 3.0f * i; // 60 degrees per vertex
        vx[i] = x + (int)(radius * cos(angle));
        vy[i] = y + (int)(radius * sin(angle));
    }

    // Set color
    SDL_SetRenderDrawColor(renderer, color.r, color.g, color.b, color.a);

    // Draw triangles from center to each pair of vertices
    for (int i = 0; i < vertices; i++)
    {
        int next = (i + 1) % vertices;
        SDL_RenderDrawLine(renderer, x, y, vx[i], vy[i]);
        SDL_RenderDrawLine(renderer, x, y, vx[next], vy[next]);
        SDL_RenderDrawLine(renderer, vx[i], vy[i], vx[next], vy[next]);

        // Draw filled triangles (approximation, better to use SDL_gfx)
        for (int r = 0; r < radius; r++)
        {
            float t = (float)r / radius;
            int x1 = x + (int)(t * (vx[i] - x));
            int y1 = y + (int)(t * (vy[i] - y));
            int x2 = x + (int)(t * (vx[next] - x));
            int y2 = y + (int)(t * (vy[next] - y));
            SDL_RenderDrawLine(renderer, x1, y1, x2, y2);
        }
    }
}

// Draw a line with energy effect (for connections between particles)
void draw_energy_line(SDL_Renderer *renderer, int x1, int y1, int x2, int y2, SDL_Color color, float energy)
{
    // Calculate line parameters
    float dx = x2 - x1;
    float dy = y2 - y1;
    float length = sqrt(dx * dx + dy * dy);

    if (length < 1)
        return; // Avoid division by zero

    float nx = dx / length; // Normalized direction vector
    float ny = dy / length;

    // Number of segments for the energy effect
    int segments = (int)(length / 10.0f);
    if (segments < 2)
        segments = 2;

    // Draw the energy line with a wavy pattern
    for (int i = 0; i < segments; i++)
    {
        float t1 = (float)i / segments;
        float t2 = (float)(i + 1) / segments;

        float wave_strength = 4.0f * energy; // Wave amplitude
        float wave_freq = 0.1f;              // Wave frequency

        float px1 = x1 + t1 * dx + sin(t1 * 20.0f + energy * 10.0f) * wave_strength * ny;
        float py1 = y1 + t1 * dy - sin(t1 * 20.0f + energy * 10.0f) * wave_strength * nx;
        float px2 = x1 + t2 * dx + sin(t2 * 20.0f + energy * 10.0f) * wave_strength * ny;
        float py2 = y1 + t2 * dy - sin(t2 * 20.0f + energy * 10.0f) * wave_strength * nx;

        // Fade color based on energy and position
        Uint8 alpha = (Uint8)(100 + 155 * energy * (1.0f - t1));
        SDL_SetRenderDrawColor(renderer, color.r, color.g, color.b, alpha);
        SDL_RenderDrawLine(renderer, (int)px1, (int)py1, (int)px2, (int)py2);
    }
}

// Draw particle trail
void draw_particle_trail(SDL_Renderer *renderer, Particle *p)
{
    // Draw trail as fading line segments
    for (int i = 0; i < PARTICLE_TRAIL_LENGTH - 1; i++)
    {
        if (p->trail_x[i] == 0 && p->trail_y[i] == 0)
            continue; // Skip uninitialized positions

        // Calculate alpha based on position in trail
        Uint8 alpha = (Uint8)(40 * (1.0f - (float)i / PARTICLE_TRAIL_LENGTH));
        SDL_SetRenderDrawColor(renderer, p->color.r, p->color.g, p->color.b, alpha);
        SDL_RenderDrawLine(renderer,
                           (int)p->trail_x[i], (int)p->trail_y[i],
                           (int)p->trail_x[i + 1], (int)p->trail_y[i + 1]);
    }
}

// Draw the big red X logo
void draw_red_x(SDL_Renderer *renderer, int centerX, int centerY, int size, int thickness, float pulse)
{
    // Calculate X dimensions with pulse effect
    int current_size = size + (int)(size * 0.2f * sin(pulse));
    int half_size = current_size / 2;
    int half_thickness = thickness / 2;

    // Calculate corners of the X
    SDL_Point points[4] = {
        {centerX - half_size, centerY - half_size}, // Top-left
        {centerX + half_size, centerY - half_size}, // Top-right
        {centerX + half_size, centerY + half_size}, // Bottom-right
        {centerX - half_size, centerY + half_size}  // Bottom-left
    };

    // Color with pulse effect - brighter at peak of pulse
    Uint8 red = 200 + (int)(55 * sin(pulse));
    SDL_SetRenderDrawColor(renderer, red, 0, 0, 255);

    // Draw the X (two thick lines)
    // First diagonal (top-left to bottom-right)
    for (int offset = -half_thickness; offset <= half_thickness; offset++)
    {
        SDL_RenderDrawLine(renderer,
                           points[0].x + offset, points[0].y,
                           points[2].x + offset, points[2].y);
    }

    // Second diagonal (top-right to bottom-left)
    for (int offset = -half_thickness; offset <= half_thickness; offset++)
    {
        SDL_RenderDrawLine(renderer,
                           points[1].x, points[1].y + offset,
                           points[3].x, points[3].y + offset);
    }
}

// Draw hover information for a particle
void draw_hover_info(AppState *state, int particle_index)
{
    if (particle_index < 0 || particle_index >= MAX_PARTICLES)
        return;
    if (!state->particles[particle_index].active)
        return;

    Particle *p = &state->particles[particle_index];

    // Draw info box
    SDL_Rect info_rect = {(int)p->x + 20, (int)p->y - 70, 180, 80}; // Increased height for more info

    // Ensure the info box stays within screen bounds
    if (info_rect.x + info_rect.w > WINDOW_WIDTH)
    {
        info_rect.x = WINDOW_WIDTH - info_rect.w;
    }
    if (info_rect.y < 0)
    {
        info_rect.y = 0;
    }

    // Semi-transparent background
    SDL_SetRenderDrawColor(state->renderer, 30, 30, 40, (Uint8)(state->hover_alpha * 220));
    SDL_RenderFillRect(state->renderer, &info_rect);

    // Border - highlight if this particle is selected
    if (state->selected_particle == particle_index)
    {
        // Pulsing border for selected particle
        Uint8 pulse = (Uint8)(180 + 75 * sin(state->pulse_state * 2));
        SDL_SetRenderDrawColor(state->renderer, pulse, pulse, pulse,
                               (Uint8)(state->hover_alpha * 255));
    }
    else
    {
        SDL_SetRenderDrawColor(state->renderer, p->color.r, p->color.g, p->color.b,
                               (Uint8)(state->hover_alpha * 255));
    }
    SDL_RenderDrawRect(state->renderer, &info_rect);

    // Text info
    SDL_Color text_color = {255, 255, 255, (Uint8)(state->hover_alpha * 255)};

    render_text(state->renderer, state->font, p->data,
                info_rect.x + 10, info_rect.y + 10, text_color, 1.2f);

    char status_text[64];
    sprintf(status_text, "Status: Active");
    render_text(state->renderer, state->font, status_text,
                info_rect.x + 10, info_rect.y + 30, text_color, 1.0f);

    // Show connection info
    char connections_text[64];
    sprintf(connections_text, "Connections: %d", p->connection_count);
    render_text(state->renderer, state->font, connections_text,
                info_rect.x + 10, info_rect.y + 50, text_color, 1.0f);
}

// Draw status bar at the bottom
void draw_status_bar(AppState *state)
{
    // Calculate how many particles of each type are active
    int type_counts[10] = {0};
    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        if (state->particles[i].active)
        {
            type_counts[state->particles[i].type]++;
        }
    }

    // Draw status bar background
    SDL_Rect status_rect = {0, WINDOW_HEIGHT - 30, WINDOW_WIDTH, 30};
    SDL_SetRenderDrawColor(state->renderer, 30, 30, 40, 200);
    SDL_RenderFillRect(state->renderer, &status_rect);

    // Draw instance information
    char instance_text[64];
    sprintf(instance_text, "Instance: %d", state->selected_instance);

    SDL_Color text_color = {200, 200, 200, 255};
    render_text(state->renderer, state->font, instance_text, 10, WINDOW_HEIGHT - 25, text_color, 1.0f);

    // Draw active node counts
    char counts_text[128];
    sprintf(counts_text, "Nodes: %d | Core: %d | Val: %d | Stor: %d | Gate: %d | Orac: %d",
            state->active_particles, type_counts[0], type_counts[1], type_counts[2],
            type_counts[3], type_counts[4]);
    render_text(state->renderer, state->font, counts_text, 150, WINDOW_HEIGHT - 25, text_color, 1.0f);

    // Draw environment info (special highlight for PowerShell)
    char env_text[64];
    SDL_Color env_color = text_color;

    // Highlight PowerShell environment with a special color
    if (state->environment == ENV_POWERSHELL)
    {
        env_color = (SDL_Color){100, 200, 255, 255}; // Light blue for PowerShell
        sprintf(env_text, "Env: %s", state->env_display_name);
        render_text(state->renderer, state->font, env_text, WINDOW_WIDTH - 400, WINDOW_HEIGHT - 25, env_color, 1.0f);
    }
    else if (state->environment_initialized)
    {
        sprintf(env_text, "Env: %s", state->env_display_name);
        render_text(state->renderer, state->font, env_text, WINDOW_WIDTH - 400, WINDOW_HEIGHT - 25, env_color, 1.0f);
    }

    // Draw help text
    char help_text[64] = "Press D for documentation";
    render_text(state->renderer, state->font, help_text, WINDOW_WIDTH - 220, WINDOW_HEIGHT - 25, text_color, 1.0f);

    // Draw mode info
    char mode_text[128];
    sprintf(mode_text, "Mode: %s | %s",
            state->interaction_mode ? "Interactive" : "Orbital",
            state->selected_particle >= 0 ? "Node Selected" : "No Selection");
    render_text(state->renderer, state->font, mode_text, 400, WINDOW_HEIGHT - 25, text_color, 1.0f);
}

// Render everything
void render(AppState *state)
{
    // Clear screen with dark background
    SDL_SetRenderDrawColor(state->renderer, 15, 15, 25, 255);
    SDL_RenderClear(state->renderer);

    int centerX = WINDOW_WIDTH / 2;
    int centerY = WINDOW_HEIGHT / 2;

    // Draw the red X logo in the center
    draw_red_x(state->renderer, centerX, centerY, X_SIZE, X_THICKNESS, state->pulse_state);

    // Draw connections between particles
    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        if (!state->particles[i].active)
            continue;

        Particle *p = &state->particles[i];

        // Draw connection lines to other nodes
        for (int c = 0; c < p->connection_count; c++)
        {
            int target = p->connected_nodes[c];
            if (target >= 0 && target < MAX_PARTICLES && state->particles[target].active)
            {
                Particle *target_p = &state->particles[target];

                // Only draw connection once (when i < target)
                if (i < target)
                {
                    SDL_Color connection_color = {
                        (p->color.r + target_p->color.r) / 2,
                        (p->color.g + target_p->color.g) / 2,
                        (p->color.b + target_p->color.b) / 2,
                        180};

                    // Draw energy line with combined energy
                    float combined_energy = (p->energy + target_p->energy) / 2.0f;
                    draw_energy_line(
                        state->renderer,
                        (int)p->x, (int)p->y,
                        (int)target_p->x, (int)target_p->y,
                        connection_color, combined_energy);
                }
            }
        }
    }

    // Draw connection from center to selected particle
    if (state->selected_particle >= 0 && state->particles[state->selected_particle].active)
    {
        Particle *selected = &state->particles[state->selected_particle];

        // Draw a bright connection line from center to selected node
        SDL_Color center_connection = {220, 220, 255, 200};
        float pulse_energy = 0.5f + 0.5f * sin(state->pulse_state * 3.0f);
        draw_energy_line(
            state->renderer,
            centerX, centerY,
            (int)selected->x, (int)selected->y,
            center_connection, pulse_energy);
    }

    // Draw particles
    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        if (state->particles[i].active)
        {
            Particle *p = &state->particles[i];

            // Skip rendering if this type is filtered out
            if (state->filter_active && !state->filter_types[p->type])
            {
                continue;
            }

            // Draw particle trail first (behind the particle)
            draw_particle_trail(state->renderer, p);

            // Draw the hexagon
            SDL_Color hex_color = p->color;

            // Make it brighter if highlighted or selected
            if (p->highlighted || i == state->selected_particle)
            {
                hex_color.r = (Uint8)fmin(255, hex_color.r * 1.3f);
                hex_color.g = (Uint8)fmin(255, hex_color.g * 1.3f);
                hex_color.b = (Uint8)fmin(255, hex_color.b * 1.3f);

                // Draw a filled hexagon for the selected particle
                if (i == state->selected_particle)
                {
                    draw_filled_hexagon(state->renderer, (int)p->x, (int)p->y,
                                        HEX_RADIUS - 2, // Slightly smaller filled hex
                                        (SDL_Color){hex_color.r, hex_color.g, hex_color.b, 80});
                }
            }

            draw_hexagon(state->renderer, (int)p->x, (int)p->y, HEX_RADIUS, hex_color);

            // Draw connection line to center if not in interaction mode
            if (!state->interaction_mode)
            {
                SDL_SetRenderDrawColor(state->renderer,
                                       p->color.r / 3, p->color.g / 3, p->color.b / 3, 100);
                SDL_RenderDrawLine(state->renderer, (int)p->x, (int)p->y, centerX, centerY);
            }
        }
    }

    // Draw mouse influence indicator if active
    if (state->mouse_active && state->interaction_mode)
    {
        // Draw a circle around the mouse cursor
        int radius = (int)(MOUSE_INFLUENCE_RADIUS * state->interaction_strength);
        int segments = 20;
        float angle_step = 2.0f * M_PI / segments;

        for (int i = 0; i < segments; i++)
        {
            float angle1 = i * angle_step;
            float angle2 = (i + 1) * angle_step;

            int x1 = state->mouse_x + (int)(cos(angle1) * radius);
            int y1 = state->mouse_y + (int)(sin(angle1) * radius);
            int x2 = state->mouse_x + (int)(cos(angle2) * radius);
            int y2 = state->mouse_y + (int)(sin(angle2) * radius);

            SDL_SetRenderDrawColor(state->renderer, 180, 180, 200, 80);
            SDL_RenderDrawLine(state->renderer, x1, y1, x2, y2);
        }
    }

    // Draw hover information if needed
    if (state->hover_particle >= 0)
    {
        draw_hover_info(state, state->hover_particle);
    }

    // Draw status bar
    draw_status_bar(state);

    // Draw documentation panel if active
    if (state->show_docs)
    {
        draw_docs_panel(state);
    }

    // Draw statistics panel if active
    if (state->stats_panel_visible)
    {
        draw_statistics_panel(state);
    }

    // Draw mode-specific UI
    if (state->mode == MODE_CREATION)
    {
        draw_creation_mode_ui(state);
    }
    else if (state->mode == MODE_SEARCH)
    {
        draw_search_mode_ui(state);
    }
    else if (state->mode == MODE_RENAME)
    {
        draw_rename_mode_ui(state);
    }

    // Draw context menu if active
    if (state->show_context_menu)
    {
        draw_context_menu(state);
    }

    // Draw filter UI if active
    if (state->show_filter_ui)
    {
        draw_filter_ui(state);
    }

    // Draw title text
    SDL_Color title_color = {255, 50, 50, 255};
    render_text_centered(state->renderer, state->font, "RED X GATEWAY",
                         centerX, 30, title_color, 2.0f);

    // Present the renderer to screen
    SDL_RenderPresent(state->renderer);
}

// Apply forces between particles
void apply_particle_interaction(AppState *state, float delta_time)
{
    int centerX = WINDOW_WIDTH / 2;
    int centerY = WINDOW_HEIGHT / 2;

    // Update each particle based on interactions
    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        if (!state->particles[i].active)
            continue;

        Particle *p = &state->particles[i];

        // Reset forces
        float fx = 0.0f;
        float fy = 0.0f;

        if (state->interaction_mode)
        {
            // Apply forces from other particles
            for (int j = 0; j < MAX_PARTICLES; j++)
            {
                if (i == j || !state->particles[j].active)
                    continue;

                Particle *other = &state->particles[j];

                // Vector between particles
                float dx = other->x - p->x;
                float dy = other->y - p->y;
                float dist_sq = dx * dx + dy * dy;
                float dist = sqrt(dist_sq);

                if (dist < 1.0f)
                    dist = 1.0f; // Avoid division by zero

                // Check if particles are connected
                bool is_connected = false;
                for (int c = 0; c < p->connection_count; c++)
                {
                    if (p->connected_nodes[c] == j)
                    {
                        is_connected = true;
                        break;
                    }
                }

                // Apply forces based on type and connection
                float force_strength;

                if (is_connected)
                {
                    // Connected nodes attract each other
                    force_strength = ATTRACTION_STRENGTH * 3.0f * state->interaction_strength;
                }
                else if (p->type == other->type)
                {
                    // Same type weakly attract
                    force_strength = ATTRACTION_STRENGTH * state->interaction_strength;
                }
                else
                {
                    // Different types repel
                    force_strength = -REPULSION_STRENGTH * state->interaction_strength;
                }

                // Force falls off with square of distance
                if (dist < INTERACTION_DISTANCE)
                {
                    float normalized_dist = dist / INTERACTION_DISTANCE;
                    float falloff = 1.0f - normalized_dist * normalized_dist;

                    // Direction vector
                    float nx = dx / dist;
                    float ny = dy / dist;

                    // Apply force
                    fx += nx * force_strength * falloff;
                    fy += ny * force_strength * falloff;
                }
            }

            // Apply force from center (weak attraction to keep particles from drifting away)
            float dx = centerX - p->x;
            float dy = centerY - p->y;
            float dist = sqrt(dx * dx + dy * dy);

            if (dist > MIN_ORBIT_RADIUS)
            {
                float center_force = 0.01f * state->interaction_strength;
                fx += dx / dist * center_force;
                fy += dy / dist * center_force;
            }

            // Apply force from mouse if active
            if (state->mouse_active)
            {
                float mx = state->mouse_x - p->x;
                float my = state->mouse_y - p->y;
                float mouse_dist = sqrt(mx * mx + my * my);

                if (mouse_dist < MOUSE_INFLUENCE_RADIUS * state->interaction_strength && mouse_dist > 1.0f)
                {
                    float normalized_dist = mouse_dist / (MOUSE_INFLUENCE_RADIUS * state->interaction_strength);
                    float falloff = 1.0f - normalized_dist * normalized_dist;

                    // Repulsion from mouse
                    float mouse_force = -MOUSE_REPULSION_STRENGTH * falloff * state->interaction_strength;
                    fx += (mx / mouse_dist) * mouse_force;
                    fy += (my / mouse_dist) * mouse_force;
                }
            }
        }
        else
        {
            // Orbital mode - adjust orbit radius gradually
            float current_dist = sqrt((p->x - centerX) * (p->x - centerX) +
                                      (p->y - centerY) * (p->y - centerY));

            if (fabs(current_dist - p->orbit_radius) > 1.0f)
            {
                float adjustment = (p->orbit_radius - current_dist) * 0.1f;

                // Vector from center to particle
                float dx = p->x - centerX;
                float dy = p->y - centerY;
                float dist = sqrt(dx * dx + dy * dy);

                if (dist > 1.0f)
                {
                    // Adjust position towards desired orbit
                    float nx = dx / dist;
                    float ny = dy / dist;

                    p->x += nx * adjustment;
                    p->y += ny * adjustment;
                }
            }
        }

        // Update velocity based on forces
        if (state->interaction_mode)
        {
            p->vx += fx * delta_time * 60.0f; // Scale by delta time and a constant for stability
            p->vy += fy * delta_time * 60.0f;

            // Apply damping (friction)
            p->vx *= 0.95f;
            p->vy *= 0.95f;

            // Limit maximum speed
            float speed = sqrt(p->vx * p->vx + p->vy * p->vy);
            if (speed > MAX_SPEED)
            {
                p->vx = (p->vx / speed) * MAX_SPEED;
                p->vy = (p->vy / speed) * MAX_SPEED;
            }

            // Update position based on velocity
            p->x += p->vx * delta_time * 60.0f;
            p->y += p->vy * delta_time * 60.0f;

            // Bounce off screen edges
            if (p->x < HEX_RADIUS)
            {
                p->x = HEX_RADIUS;
                p->vx = fabs(p->vx) * 0.8f; // Reduce energy on bounce
            }
            else if (p->x > WINDOW_WIDTH - HEX_RADIUS)
            {
                p->x = WINDOW_WIDTH - HEX_RADIUS;
                p->vx = -fabs(p->vx) * 0.8f;
            }

            if (p->y < HEX_RADIUS)
            {
                p->y = HEX_RADIUS;
                p->vy = fabs(p->vy) * 0.8f;
            }
            else if (p->y > WINDOW_HEIGHT - HEX_RADIUS)
            {
                p->y = WINDOW_HEIGHT - HEX_RADIUS;
                p->vy = -fabs(p->vy) * 0.8f;
            }

            // Calculate new orbit radius (for return to orbital mode)
            p->orbit_radius = sqrt((p->x - centerX) * (p->x - centerX) +
                                   (p->y - centerY) * (p->y - centerY));

            // Clamp orbit radius to valid range
            if (p->orbit_radius < MIN_ORBIT_RADIUS)
                p->orbit_radius = MIN_ORBIT_RADIUS;
            if (p->orbit_radius > MAX_ORBIT_RADIUS)
                p->orbit_radius = MAX_ORBIT_RADIUS;

            // Calculate angle from center
            p->angle = atan2(p->y - centerY, p->x - centerX);
            if (p->angle < 0)
                p->angle += 2.0f * M_PI;
        }
        else
        {
            // Orbital mode
            // Calculate position based on orbit
            p->x = centerX + cos(p->angle) * p->orbit_radius;
            p->y = centerY + sin(p->angle) * p->orbit_radius;

            // Update angle for next frame
            p->angle += p->speed / 100.0f;
            if (p->angle > 2.0f * M_PI)
            {
                p->angle -= 2.0f * M_PI;
            }
        }

        // Update trail positions (shift and add current position)
        for (int t = PARTICLE_TRAIL_LENGTH - 1; t > 0; t--)
        {
            p->trail_x[t] = p->trail_x[t - 1];
            p->trail_y[t] = p->trail_y[t - 1];
        }
        p->trail_x[0] = p->x;
        p->trail_y[0] = p->y;

        // Update energy for effects (simply oscillates over time)
        if (p->highlighted || i == state->selected_particle)
        {
            p->energy = 0.5f + 0.5f * sin(state->pulse_state * 2.0f + i * 0.2f);
        }
        else
        {
            p->energy *= 0.95f; // Decay energy if not highlighted
        }
    }
}

// Add a connection between two particles
void add_particle_connection(AppState *state, int particle1, int particle2)
{
    if (particle1 == particle2)
        return;
    if (particle1 < 0 || particle1 >= MAX_PARTICLES)
        return;
    if (particle2 < 0 || particle2 >= MAX_PARTICLES)
        return;
    if (!state->particles[particle1].active || !state->particles[particle2].active)
        return;

    // Check if connection already exists
    Particle *p1 = &state->particles[particle1];
    Particle *p2 = &state->particles[particle2];

    // Check p1 -> p2
    bool connection_exists = false;
    for (int i = 0; i < p1->connection_count; i++)
    {
        if (p1->connected_nodes[i] == particle2)
        {
            connection_exists = true;
            break;
        }
    }

    // If connection doesn't exist, add it (if there's room)
    if (!connection_exists)
    {
        if (p1->connection_count < CONNECTED_NODES_MAX)
        {
            p1->connected_nodes[p1->connection_count++] = particle2;
        }
        if (p2->connection_count < CONNECTED_NODES_MAX)
        {
            p2->connected_nodes[p2->connection_count++] = particle1;
        }

        // Boost energy for visual effect
        p1->energy = 1.0f;
        p2->energy = 1.0f;
    }
}

// Remove a connection between two particles
void remove_particle_connection(AppState *state, int particle1, int particle2)
{
    if (particle1 == particle2)
        return;
    if (particle1 < 0 || particle1 >= MAX_PARTICLES)
        return;
    if (particle2 < 0 || particle2 >= MAX_PARTICLES)
        return;
    if (!state->particles[particle1].active || !state->particles[particle2].active)
        return;

    // Remove the connection from p1
    Particle *p1 = &state->particles[particle1];
    for (int i = 0; i < p1->connection_count; i++)
    {
        if (p1->connected_nodes[i] == particle2)
        {
            // Shift remaining connections down
            for (int j = i; j < p1->connection_count - 1; j++)
            {
                p1->connected_nodes[j] = p1->connected_nodes[j + 1];
            }
            p1->connection_count--;
            break;
        }
    }

    // Remove the connection from p2
    Particle *p2 = &state->particles[particle2];
    for (int i = 0; i < p2->connection_count; i++)
    {
        if (p2->connected_nodes[i] == particle1)
        {
            // Shift remaining connections down
            for (int j = i; j < p2->connection_count - 1; j++)
            {
                p2->connected_nodes[j] = p2->connected_nodes[j + 1];
            }
            p2->connection_count--;
            break;
        }
    }
}

// Handle events
void handle_events(AppState *state)
{
    SDL_Event e;

    // Get mouse state for hover effects
    int mouseX, mouseY;
    Uint32 mouse_buttons = SDL_GetMouseState(&mouseX, &mouseY);

    // Store mouse position for influence calculations
    state->mouse_x = mouseX;
    state->mouse_y = mouseY;

    // Update dragged particle position if dragging
    if (state->dragging && state->dragged_particle >= 0)
    {
        Particle *p = &state->particles[state->dragged_particle];
        p->x = mouseX + state->drag_offset_x;
        p->y = mouseY + state->drag_offset_y;

        // Update orbit radius and angle for orbital mode
        int centerX = WINDOW_WIDTH / 2;
        int centerY = WINDOW_HEIGHT / 2;
        float dx = p->x - centerX;
        float dy = p->y - centerY;
        p->orbit_radius = sqrt(dx * dx + dy * dy);
        p->angle = atan2(dy, dx);
        if (p->angle < 0)
            p->angle += 2.0f * M_PI;

        // Reset velocity when dragging
        p->vx = 0;
        p->vy = 0;
    }

    // Check which particle is being hovered
    int hover_index = -1;
    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        if (state->particles[i].active)
        {
            float dx = state->particles[i].x - mouseX;
            float dy = state->particles[i].y - mouseY;
            float distance = sqrt(dx * dx + dy * dy);

            if (distance < HEX_RADIUS)
            {
                hover_index = i;
                break;
            }
        }
    }

    // Update hover state
    if (hover_index != state->hover_particle)
    {
        // Unhighlight the previous particle
        if (state->hover_particle >= 0 && state->hover_particle < MAX_PARTICLES)
        {
            state->particles[state->hover_particle].highlighted = false;
        }

        state->hover_particle = hover_index;

        // Highlight the new hovered particle
        if (state->hover_particle >= 0)
        {
            state->particles[state->hover_particle].highlighted = true;
        }

        state->hover_alpha = 0; // Reset alpha when changing hover target
    }
    else if (state->hover_particle >= 0)
    {
        // Fade in hover info
        state->hover_alpha = fminf(state->hover_alpha + 0.1f, 1.0f);
    }

    // Mouse button state for particle interactions
    state->mouse_active = (mouse_buttons & SDL_BUTTON(SDL_BUTTON_RIGHT)) != 0;

    // Process events
    while (SDL_PollEvent(&e) != 0)
    {
        if (e.type == SDL_QUIT)
        {
            state->running = false;
        }
        else if (e.type == SDL_KEYDOWN)
        {
            // Only handle base keyboard events when not in search mode
            if (state->mode == MODE_SEARCH)
            {
                // Handle search mode text input
                if (e.key.keysym.sym == SDLK_ESCAPE)
                {
                    // Exit search mode
                    state->mode = MODE_NORMAL;

                    // Unhighlight all search results
                    for (int i = 0; i < state->search_count; i++)
                    {
                        int idx = state->search_results[i];
                        if (idx >= 0 && idx < MAX_PARTICLES)
                        {
                            state->particles[idx].highlighted = false;
                        }
                    }

                    state->search_count = 0;
                    memset(state->search_term, 0, sizeof(state->search_term));
                }
                else if (e.key.keysym.sym == SDLK_BACKSPACE)
                {
                    // Delete the last character of search term
                    int len = strlen(state->search_term);
                    if (len > 0)
                    {
                        state->search_term[len - 1] = '\0';

                        // Re-run search with updated term
                        if (strlen(state->search_term) > 0)
                        {
                            // Unhighlight previous results
                            for (int i = 0; i < state->search_count; i++)
                            {
                                int idx = state->search_results[i];
                                if (idx >= 0 && idx < MAX_PARTICLES)
                                {
                                    state->particles[idx].highlighted = false;
                                }
                            }

                            search_particles(state, state->search_term);
                        }
                        else
                        {
                            // Clear results if search term is empty
                            for (int i = 0; i < state->search_count; i++)
                            {
                                int idx = state->search_results[i];
                                if (idx >= 0 && idx < MAX_PARTICLES)
                                {
                                    state->particles[idx].highlighted = false;
                                }
                            }
                            state->search_count = 0;
                        }
                    }
                }
            }
            else if (state->mode == MODE_RENAME)
            {
                // Handle rename mode keyboard input
                if (e.key.keysym.sym == SDLK_ESCAPE)
                {
                    // Cancel renaming
                    state->mode = MODE_NORMAL;
                    state->rename_particle = -1;
                    memset(state->rename_buffer, 0, sizeof(state->rename_buffer));
                }
                else if (e.key.keysym.sym == SDLK_RETURN || e.key.keysym.sym == SDLK_KP_ENTER)
                {
                    // Save new name if not empty
                    if (strlen(state->rename_buffer) > 0 && state->rename_particle >= 0 &&
                        state->rename_particle < MAX_PARTICLES &&
                        state->particles[state->rename_particle].active)
                    {

                        // Copy the new name to the particle's data field
                        strncpy(state->particles[state->rename_particle].data,
                                state->rename_buffer,
                                sizeof(state->particles[state->rename_particle].data) - 1);

                        // Ensure null termination
                        state->particles[state->rename_particle].data[sizeof(state->particles[state->rename_particle].data) - 1] = '\0';

                        printf("Renamed node to: %s\n", state->rename_buffer);
                    }

                    // Exit rename mode
                    state->mode = MODE_NORMAL;
                    state->rename_particle = -1;
                    memset(state->rename_buffer, 0, sizeof(state->rename_buffer));
                }
                else if (e.key.keysym.sym == SDLK_BACKSPACE)
                {
                    // Delete the last character of rename buffer
                    int len = strlen(state->rename_buffer);
                    if (len > 0)
                    {
                        state->rename_buffer[len - 1] = '\0';
                    }
                }
            }
            else
            {
                // Handle normal mode keyboard events
                switch (e.key.keysym.sym)
                {
                case SDLK_ESCAPE:
                    // If in creation mode, return to normal mode
                    if (state->mode == MODE_CREATION)
                    {
                        state->mode = MODE_NORMAL;
                    }
                    else
                    {
                        state->running = false;
                    }
                    break;
                case SDLK_d:
                    // Toggle documentation
                    state->show_docs = !state->show_docs;
                    break;
                case SDLK_i:
                    // Toggle interaction mode
                    state->interaction_mode = !state->interaction_mode;
                    break;
                case SDLK_r:
                    // Reset particles to orbit
                    for (int i = 0; i < MAX_PARTICLES; i++)
                    {
                        if (state->particles[i].active)
                        {
                            state->particles[i].vx = 0;
                            state->particles[i].vy = 0;
                        }
                    }
                    state->interaction_mode = false;
                    break;
                case SDLK_c:
                    // Toggle creation mode
                    if (state->mode == MODE_CREATION)
                    {
                        state->mode = MODE_NORMAL;
                    }
                    else
                    {
                        state->mode = MODE_CREATION;
                        state->creation_cooldown = 0.0f;
                    }
                    break;
                case SDLK_s:
                    // Toggle stats panel
                    state->stats_panel_visible = !state->stats_panel_visible;
                    break;
                case SDLK_t:
                    // Toggle filter UI
                    state->show_filter_ui = !state->show_filter_ui;
                    break;
                case SDLK_f:
                    // Enter search mode
                    state->mode = MODE_SEARCH;
                    memset(state->search_term, 0, sizeof(state->search_term));
                    state->search_count = 0;
                    break;
                case SDLK_PLUS:
                case SDLK_EQUALS:
                    // Increase interaction strength
                    state->interaction_strength = fminf(state->interaction_strength * 1.2f, 2.0f);
                    break;
                case SDLK_MINUS:
                    // Decrease interaction strength
                    state->interaction_strength = fmaxf(state->interaction_strength * 0.8f, 0.2f);
                    break;

                // Node creation type selection with number keys
                case SDLK_0:
                case SDLK_1:
                case SDLK_2:
                case SDLK_3:
                case SDLK_4:
                case SDLK_5:
                case SDLK_6:
                case SDLK_7:
                case SDLK_8:
                case SDLK_9:
                    if (state->mode == MODE_CREATION)
                    {
                        state->creation_type = e.key.keysym.sym - SDLK_0;
                    }
                    else
                    {
                        state->selected_instance = e.key.keysym.sym - SDLK_0;
                        printf("Switched to instance %d\n", state->selected_instance);
                    }
                    break;
                }
            }
        }
        else if (e.type == SDL_MOUSEBUTTONUP)
        {
            // Handle mouse button up events
            if (e.button.button == SDL_BUTTON_LEFT)
            {
                // End dragging if we were dragging a particle
                if (state->dragging)
                {
                    state->dragging = false;
                    state->dragged_particle = -1;

                    // Update stats if visible
                    if (state->stats_panel_visible)
                    {
                        calculate_network_stats(state, 0.0f);
                    }
                }
            }
        }
        else if (e.type == SDL_MOUSEBUTTONDOWN)
        {
            if (e.button.button == SDL_BUTTON_RIGHT && state->mode == MODE_NORMAL)
            {
                // Right click context menu
                if (state->hover_particle >= 0)
                {
                    // Show context menu for the hovered particle
                    state->show_context_menu = true;
                    state->context_menu_particle = state->hover_particle;
                    state->context_menu_x = e.button.x;
                    state->context_menu_y = e.button.y;
                    return;
                }
            }

            if (e.button.button == SDL_BUTTON_LEFT)
            {
                // Start dragging if we're clicking on a node and not in creation mode
                if (state->hover_particle >= 0 && state->mode == MODE_NORMAL)
                {
                    // Calculate offset from mouse to particle center (for smooth dragging)
                    Particle *p = &state->particles[state->hover_particle];
                    state->drag_offset_x = p->x - mouseX;
                    state->drag_offset_y = p->y - mouseY;

                    // Start dragging
                    state->dragging = true;
                    state->dragged_particle = state->hover_particle;

                    // Select the dragged particle
                    state->selected_particle = state->hover_particle;
                }

                // Check if in node creation mode
                if (state->mode == MODE_CREATION && state->creation_cooldown <= 0)
                {
                    // Check if we're not clicking on an existing node
                    bool valid_position = true;
                    for (int i = 0; i < MAX_PARTICLES; i++)
                    {
                        if (state->particles[i].active)
                        {
                            float dx = state->particles[i].x - mouseX;
                            float dy = state->particles[i].y - mouseY;
                            float distance = sqrt(dx * dx + dy * dy);
                            if (distance < HEX_RADIUS * 2)
                            {
                                valid_position = false;
                                break;
                            }
                        }
                    }

                    if (valid_position)
                    {
                        // Create a new node
                        int new_index = create_new_particle(state, state->creation_type, mouseX, mouseY);
                        if (new_index >= 0)
                        {
                            printf("Created new %d type node at (%d,%d)\n",
                                   state->creation_type, mouseX, mouseY);
                            state->creation_cooldown = CREATION_COOLDOWN;

                            // Select the newly created node
                            state->selected_particle = new_index;
                        }
                        else
                        {
                            printf("Failed to create node - maximum limit reached\n");
                        }
                    }
                    return;
                }

                // Check if clicking on close button in stats panel
                if (state->stats_panel_visible)
                {
                    SDL_Rect close_btn = {WINDOW_WIDTH - 280 + 260 - 30, 100 + 10, 20, 20};
                    if (e.button.x >= close_btn.x && e.button.x < close_btn.x + close_btn.w &&
                        e.button.y >= close_btn.y && e.button.y < close_btn.y + close_btn.h)
                    {
                        state->stats_panel_visible = false;
                        return;
                    }
                }

                // Check if clicking on close button in docs panel
                if (state->show_docs)
                {
                    SDL_Rect close_btn = {WINDOW_WIDTH - 30 - 50, 10 + 50, 20, 20};
                    if (e.button.x >= close_btn.x && e.button.x < close_btn.x + close_btn.w &&
                        e.button.y >= close_btn.y && e.button.y < close_btn.y + close_btn.h)
                    {
                        state->show_docs = false;
                        return;
                    }
                }

                // Check if in creation mode, clicking on type selection
                if (state->mode == MODE_CREATION)
                {
                    int start_x = 300;
                    int y = 45;
                    int spacing = 50;

                    for (int i = 0; i < 10; i++)
                    {
                        int x = start_x + i * spacing;
                        SDL_Rect type_rect = {x - 15, y - 15, 40, 40};

                        if (e.button.x >= type_rect.x && e.button.x < type_rect.x + type_rect.w &&
                            e.button.y >= type_rect.y && e.button.y < type_rect.y + type_rect.h)
                        {
                            state->creation_type = i;
                            return;
                        }
                    }
                }

                // Check if clicking on a particle
                if (state->hover_particle >= 0)
                {
                    printf("Clicked on %s\n", state->particles[state->hover_particle].data);

                    // If shift is held, toggle connection between selected and hovered
                    if (state->selected_particle >= 0 && state->selected_particle != state->hover_particle)
                    {
                        bool connection_exists = false;
                        Particle *p = &state->particles[state->selected_particle];
                        for (int i = 0; i < p->connection_count; i++)
                        {
                            if (p->connected_nodes[i] == state->hover_particle)
                            {
                                connection_exists = true;
                                break;
                            }
                        }

                        if (connection_exists)
                        {
                            remove_particle_connection(state, state->selected_particle, state->hover_particle);
                        }
                        else
                        {
                            add_particle_connection(state, state->selected_particle, state->hover_particle);
                        }
                    }
                    else
                    {
                        // Toggle selection
                        if (state->selected_particle == state->hover_particle)
                        {
                            state->selected_particle = -1; // Deselect
                        }
                        else
                        {
                            state->selected_particle = state->hover_particle;
                        }
                    }
                }
                else
                {
                    // Clicked on empty space, deselect
                    state->selected_particle = -1;
                }
            }
        }
    }
}

// Empty implementations for missing functions
void draw_docs_panel(AppState *state)
{
    SDL_Rect panel = {WINDOW_WIDTH - 300, 50, 290, WINDOW_HEIGHT - 100};
    SDL_SetRenderDrawColor(state->renderer, 30, 30, 40, 200);
    SDL_RenderFillRect(state->renderer, &panel);
    SDL_SetRenderDrawColor(state->renderer, 200, 200, 220, 255);
    SDL_RenderDrawRect(state->renderer, &panel);

    // Draw title
    SDL_Color title_color = {220, 220, 220, 255};
    render_text(state->renderer, state->font, "Documentation", panel.x + 20, panel.y + 20, title_color, 1.5f);
}

void draw_statistics_panel(AppState *state)
{
    SDL_Rect panel = {WINDOW_WIDTH - 280, 100, 260, 300};
    SDL_SetRenderDrawColor(state->renderer, 30, 30, 40, 200);
    SDL_RenderFillRect(state->renderer, &panel);
    SDL_SetRenderDrawColor(state->renderer, 200, 200, 220, 255);
    SDL_RenderDrawRect(state->renderer, &panel);

    // Draw title
    SDL_Color title_color = {220, 220, 220, 255};
    render_text(state->renderer, state->font, "Network Statistics", panel.x + 20, panel.y + 20, title_color, 1.2f);
}

void draw_creation_mode_ui(AppState *state)
{
    SDL_Color text_color = {220, 220, 220, 255};
    render_text_centered(state->renderer, state->font, "Creation Mode", WINDOW_WIDTH / 2, 70, text_color, 1.2f);
}

void draw_search_mode_ui(AppState *state)
{
    SDL_Color text_color = {220, 220, 220, 255};
    render_text_centered(state->renderer, state->font, "Search Mode", WINDOW_WIDTH / 2, 70, text_color, 1.2f);
}

void draw_rename_mode_ui(AppState *state)
{
    // Placeholder implementation
    SDL_Color text_color = {220, 220, 220, 255};
    render_text_centered(state->renderer, state->font, "Rename Mode", WINDOW_WIDTH / 2, 70, text_color, 1.2f);
}

void draw_context_menu(AppState *state)
{
    // Placeholder implementation
    SDL_Rect menu = {state->context_menu_x, state->context_menu_y, 150, 100};
    SDL_SetRenderDrawColor(state->renderer, 40, 40, 50, 230);
    SDL_RenderFillRect(state->renderer, &menu);
    SDL_SetRenderDrawColor(state->renderer, 200, 200, 220, 255);
    SDL_RenderDrawRect(state->renderer, &menu);
}

void draw_filter_ui(AppState *state)
{
    // Placeholder implementation
    SDL_Rect panel = {10, 50, 150, 200};
    SDL_SetRenderDrawColor(state->renderer, 30, 30, 40, 200);
    SDL_RenderFillRect(state->renderer, &panel);
    SDL_SetRenderDrawColor(state->renderer, 200, 200, 220, 255);
    SDL_RenderDrawRect(state->renderer, &panel);

    // Draw title
    SDL_Color title_color = {220, 220, 220, 255};
    render_text(state->renderer, state->font, "Filter Types", panel.x + 20, panel.y + 20, title_color, 1.2f);
}

void search_particles(AppState *state, const char *search_term)
{
    // Placeholder implementation
    state->search_count = 0;

    // Simple case-insensitive search
    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        if (state->particles[i].active)
        {
            if (strcasestr(state->particles[i].data, search_term))
            {
                if (state->search_count < MAX_SEARCH_RESULTS)
                {
                    state->search_results[state->search_count++] = i;
                    state->particles[i].highlighted = true;
                }
            }
        }
    }
}

void calculate_network_stats(AppState *state, float delta_time)
{
    // Placeholder implementation
    state->stats.update_timer += delta_time;

    // Only update stats periodically to avoid performance impact
    if (state->stats.update_timer < STATISTICS_UPDATE_INTERVAL)
    {
        return;
    }

    // Reset stats
    for (int i = 0; i < 10; i++)
    {
        state->stats.nodes_by_type[i] = 0;
    }
    state->stats.total_connections = 0;
    state->stats.average_connections = 0;
    state->stats.network_density = 0.0f;
    state->stats.most_connected_node = -1;
    state->stats.update_timer = 0.0f;

    // Count nodes by type
    int active_nodes = 0;
    int max_connections = 0;

    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        if (state->particles[i].active)
        {
            state->stats.nodes_by_type[state->particles[i].type]++;
            active_nodes++;

            // Count connections
            state->stats.total_connections += state->particles[i].connection_count;

            // Track most connected node
            if (state->particles[i].connection_count > max_connections)
            {
                max_connections = state->particles[i].connection_count;
                state->stats.most_connected_node = i;
            }
        }
    }

    // Calculate average connections and network density
    if (active_nodes > 0)
    {
        state->stats.average_connections = state->stats.total_connections / active_nodes;

        // Network density = actual connections / possible connections
        int possible_connections = active_nodes * (active_nodes - 1) / 2; // n(n-1)/2
        if (possible_connections > 0)
        {
            state->stats.network_density = (float)state->stats.total_connections / (float)possible_connections;
        }
    }
}

int create_new_particle(AppState *state, int type, float x, float y)
{
    // Find an available slot
    int index = -1;
    for (int i = 0; i < MAX_PARTICLES; i++)
    {
        if (!state->particles[i].active)
        {
            index = i;
            break;
        }
    }

    if (index < 0)
        return -1; // No slots available

    // Initialize the new particle
    Particle *p = &state->particles[index];
    p->active = true;
    p->x = x;
    p->y = y;
    p->type = type;
    p->connection_count = 0;
    p->highlighted = false;
    p->energy = 1.0f; // Start with full energy

    // Calculate orbit parameters
    int centerX = WINDOW_WIDTH / 2;
    int centerY = WINDOW_HEIGHT / 2;
    float dx = x - centerX;
    float dy = y - centerY;
    p->orbit_radius = sqrt(dx * dx + dy * dy);
    p->angle = atan2(dy, dx);
    if (p->angle < 0)
        p->angle += 2.0f * M_PI;

    // Randomize speed
    p->speed = 0.2f + ((float)rand() / RAND_MAX) * 0.5f;

    // Initialize velocity
    p->vx = 0;
    p->vy = 0;

    // Initialize trail
    for (int t = 0; t < PARTICLE_TRAIL_LENGTH; t++)
    {
        p->trail_x[t] = x;
        p->trail_y[t] = y;
    }

    // Set color based on type
    switch (type)
    {
    case 0:
        p->color = (SDL_Color){255, 100, 100, 255}; // Red
        sprintf(p->data, "Core Node %d", index);
        break;
    case 1:
        p->color = (SDL_Color){100, 255, 100, 255}; // Green
        sprintf(p->data, "Validator %d", index);
        break;
    case 2:
        p->color = (SDL_Color){100, 100, 255, 255}; // Blue
        sprintf(p->data, "Storage %d", index);
        break;
    case 3:
        p->color = (SDL_Color){255, 255, 100, 255}; // Yellow
        sprintf(p->data, "Gateway %d", index);
        break;
    case 4:
        p->color = (SDL_Color){255, 100, 255, 255}; // Magenta
        sprintf(p->data, "Oracle %d", index);
        break;
    case 5:
        p->color = (SDL_Color){100, 255, 255, 255}; // Cyan
        sprintf(p->data, "Bridge %d", index);
        break;
    case 6:
        p->color = (SDL_Color){255, 150, 50, 255}; // Orange
        sprintf(p->data, "Relay %d", index);
        break;
    case 7:
        p->color = (SDL_Color){150, 100, 200, 255}; // Purple
        sprintf(p->data, "Archive %d", index);
        break;
    case 8:
        p->color = (SDL_Color){100, 200, 150, 255}; // Teal
        sprintf(p->data, "Identity %d", index);
        break;
    case 9:
        p->color = (SDL_Color){200, 200, 200, 255}; // Light gray
        sprintf(p->data, "Client %d", index);
        break;
    }

    state->active_particles++;
    return index;
}

void detect_environment(AppState *state)
{
    // Placeholder implementation
    state->environment = ENV_BROWSER;
    strcpy(state->env_display_name, "Web Browser");
    state->environment_initialized = true;
}

void update(AppState *state)
{
    // Handle pulse effect
    state->pulse_state += X_PULSE_SPEED;
    if (state->pulse_state > 2.0f * M_PI)
    {
        state->pulse_state -= 2.0f * M_PI;
    }

    // Calculate delta time in seconds
    Uint32 current_time = SDL_GetTicks();
    float delta_time = (current_time - state->last_update_time) / 1000.0f;
    state->last_update_time = current_time;

    // Update particle positions and interactions
    apply_particle_interaction(state, delta_time);
}
