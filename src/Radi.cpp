#include <glm/glm.hpp>
#include <iostream>
#include "Radi.hpp"
#include "Scene.hpp"
#include "glad/glad.h"
#include "GLFW/glfw3.h"
#include "Shader.hpp"
#include "Camera.hpp"
#include "Window.hpp"
const std::string PROJECT_ROOT = "C:\\Users\\Robert Ward\\source\\repos\\Radi\\src";
const int VIEWPORT_X = 800;
const int VIEWPORT_Y = 600;
const int WINDOW_X = 800;
const int WINDOW_Y = 600;

void setupFullscreenQuad(unsigned int &VAO, unsigned int &VBO);

int main() {
    // Specify window dimensions and title
    const int windowWidth = 800;
    const int windowHeight = 600;
    const char* windowTitle = "Radi";
    // Create Window instance
    Radi::Types::Window window(windowWidth, windowHeight, windowTitle);

    // Initialize the window and OpenGL context
    if (!window.Initialize()) {
        std::cerr << "Failed to initialize the window and OpenGL context" << std::endl;
        return -1;
    }
    Radi::Types::Camera camera;
    Radi::Types::Shader shader((PROJECT_ROOT + "\\shader.vert").c_str(),(PROJECT_ROOT + "\\shader.frag").c_str());
    Radi::Types::Object cube;
    window.SetCamera(&camera);
    std::vector<glm::vec3> vertices = {
        // Front face
        glm::vec3(-0.5f, -0.5f,  0.5f), glm::vec3(0.5f, -0.5f,  0.5f), glm::vec3(0.5f,  0.5f,  0.5f),
        glm::vec3(0.5f,  0.5f,  0.5f), glm::vec3(-0.5f,  0.5f,  0.5f), glm::vec3(-0.5f, -0.5f,  0.5f),
        // Back face
        glm::vec3(-0.5f, -0.5f, -0.5f), glm::vec3(-0.5f,  0.5f, -0.5f), glm::vec3(0.5f,  0.5f, -0.5f),
        glm::vec3(0.5f,  0.5f, -0.5f), glm::vec3(0.5f, -0.5f, -0.5f), glm::vec3(-0.5f, -0.5f, -0.5f),
        // Top face
        glm::vec3(-0.5f,  0.5f, -0.5f), glm::vec3(-0.5f,  0.5f,  0.5f), glm::vec3(0.5f,  0.5f,  0.5f),
        glm::vec3(0.5f,  0.5f,  0.5f), glm::vec3(0.5f,  0.5f, -0.5f), glm::vec3(-0.5f,  0.5f, -0.5f),
        // Bottom face
        glm::vec3(-0.5f, -0.5f, -0.5f), glm::vec3(0.5f, -0.5f, -0.5f), glm::vec3(0.5f, -0.5f,  0.5f),
        glm::vec3(0.5f, -0.5f,  0.5f), glm::vec3(-0.5f, -0.5f,  0.5f), glm::vec3(-0.5f, -0.5f, -0.5f),
        // Right face
        glm::vec3(0.5f, -0.5f, -0.5f), glm::vec3(0.5f,  0.5f, -0.5f), glm::vec3(0.5f,  0.5f,  0.5f),
        glm::vec3(0.5f,  0.5f,  0.5f), glm::vec3(0.5f, -0.5f,  0.5f), glm::vec3(0.5f, -0.5f, -0.5f),
        // Left face
        glm::vec3(-0.5f, -0.5f, -0.5f), glm::vec3(-0.5f, -0.5f,  0.5f), glm::vec3(-0.5f,  0.5f,  0.5f),
        glm::vec3(-0.5f,  0.5f,  0.5f), glm::vec3(-0.5f,  0.5f, -0.5f), glm::vec3(-0.5f, -0.5f, -0.5f)
    };
     
    cube.Initialize(vertices);


    Radi::Types::Scene scene;

    // Setup fullscreen quad
    unsigned int VAO, VBO;
    setupFullscreenQuad(VAO, VBO);

    float lastFrame = 0.0f;
    float deltaTime = 0.0f;
    // Main loop
    while (!window.ShouldClose()) {

        float currentFrame = glfwGetTime();
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;

        // Input handling
        window.ProcessInput(deltaTime);



        // Render commands...
        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);


        glm::mat4 projection = camera.GetProjectionMatrix(windowWidth, windowHeight);
        glm::mat4 view = camera.GetViewMatrix();

        shader.use();
        shader.setMat4("projection",projection);
        shader.setMat4("view",view);

        // Here you would add your rendering logic
        cube.Render();



        // Swap buffers and poll IO events
        window.SwapBuffers();
        window.PollEvents();
    }

    // Cleanup is handled by the Window class destructor
    return 0;
}


void setupFullscreenQuad(unsigned int &VAO, unsigned int &VBO) {
    float vertices[] = {
        // positions
        -1.0f,  1.0f, 0.0f, // Top Left
        -1.0f, -1.0f, 0.0f, // Bottom Left
         1.0f, -1.0f, 0.0f, // Bottom Right
        -1.0f,  1.0f, 0.0f, // Top Left
         1.0f, -1.0f, 0.0f, // Bottom Right
         1.0f,  1.0f, 0.0f  // Top Right
    };

    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);

    glBindVertexArray(VAO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

    // Position attribute
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);

    glBindBuffer(GL_ARRAY_BUFFER, 0); 
    glBindVertexArray(0); 
}
