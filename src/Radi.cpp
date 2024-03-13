#include <glm/glm.hpp>
#include <iostream>
#include "Radi.hpp"
#include "Scene.hpp"
#include "glad/glad.h"
#include "GLFW/glfw3.h"
#include "Shader.hpp"
#include "Camera.hpp"
#include "Window.hpp"
#include "Light.hpp"
#include "Material.hpp"
#include "nlohmann/json.hpp"

const std::string PROJECT_ROOT = "C:\\Users\\Robert Ward\\source\\repos\\Radi\\src";

const int WINDOW_X = 1920/2;
const int WINDOW_Y = 1080/2;

bool isDebug = false;
int main() {
    const char* windowTitle = "Radi";

    // Create Window instance and context
    auto& window = Radi::Types::Window::Get(WINDOW_X,WINDOW_Y,windowTitle);

    // Initialize the window and OpenGL context
    if (!window.Initialize()) {
        std::cerr << "Failed to initialize the window and OpenGL context" << std::endl;
        return -1;
    }

    // Create shader
    std::unique_ptr<Radi::Types::Shader> shader = std::make_unique<Radi::Types::Shader>(
        (PROJECT_ROOT + "\\Shaders\\raymarch.vert").c_str(), 
        (PROJECT_ROOT + "\\shaders\\raymarch2.frag").c_str());
    shader->use();
    shader->setInt("VP_X", WINDOW_X);
    shader->setInt("VP_Y", WINDOW_Y);
    //shader->setUpFullscreenQuad();

    // Create, load and configure the scene
    Radi::Types::Scene* scene = new Radi::Types::Scene();
    scene->LoadSceneFromFile((PROJECT_ROOT + "\\Scenes\\BRDFScene.json").c_str());
    scene->SetActiveShader(std::move(shader));
    scene->Configure();
    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LESS);

    float lastFrame = 0.0f;
    float deltaTime = 0.0f;

    bool gKeyWasPressed = false;


    // Main loop
    while (!window.ShouldClose()) {

        float currentFrame = glfwGetTime();
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;

        // Process changes from input events
        scene->ProcessInput(deltaTime);
        // Update data on CPU side and transfer to GPU
        scene->Update(deltaTime);
        // Render commands...

        glClearColor(1.0f, 0.0f, 1.0f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT|GL_DEPTH_BUFFER_BIT);
        
        scene->Render();

        // Swap buffers and poll IO events
        window.SwapBuffers();
        window.PollEvents();
    }
    return 0;
}