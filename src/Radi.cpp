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

#define SPHERE 0
#define BOX 1
#define TRIANGLE 2
#define PLANE 3

#define POINT_LIGHT 999
#define AREA_LIGHT 998
#define DIRECTIONAL_LIGHT 997
#define DISCT_LIGHT 996
const std::string PROJECT_ROOT = "C:\\Users\\Robert Ward\\source\\repos\\Radi\\src";
const int VIEWPORT_X = 1920/2;
const int VIEWPORT_Y = 1080/2;
const int WINDOW_X = 1920/2;
const int WINDOW_Y = 1080/2;
const int aspectRatio = static_cast<float>(WINDOW_X)/ static_cast<float>(WINDOW_Y);
void setupFullscreenQuad(unsigned int &VAO, unsigned int &VBO);

bool isDebug = false;
int main() {
    const char* windowTitle = "Radi";
//        Radi::Types::Window window(WINDOW_X, WINDOW_Y, windowTitle);

    // Create Window instance and context
    auto& window = Radi::Types::Window::Get();

    // Initialize the window and OpenGL context
    if (!window.Initialize()) {
        std::cerr << "Failed to initialize the window and OpenGL context" << std::endl;
        return -1;
    }

    // Create shader
    std::unique_ptr<Radi::Types::Shader> shader = std::make_unique<Radi::Types::Shader>((PROJECT_ROOT + "\\Shaders\\raymarch.vert").c_str(), (PROJECT_ROOT + "\\shaders\\raymarch.frag").c_str());
    // Load scene
    Radi::Types::Scene* scene = new Radi::Types::Scene();

    scene->LoadSceneFromFile((PROJECT_ROOT + "\\Scenes\\Scene4.json").c_str());
    scene->SetActiveShader(std::move(shader));
    scene->SetRenderingMethod(Radi::Types::RenderingMethod::RayTraced);

    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LESS);

    float lastFrame = 0.0f;
    float deltaTime = 0.0f;

    bool gKeyWasPressed = false;

    // shader.setBool("motionBlurActive",false);
    // shader.use();
    // shader.setFloat("aspectRatio",aspectRatio);
    // shader.setFloat("VP_X",VIEWPORT_X);
    // shader.setFloat("VP_Y",VIEWPORT_Y);

    // Main loop
    while (!window.ShouldClose()) {

        float currentFrame = glfwGetTime();
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;

        // Input handling
        window.PollEvents();

        scene->ProcessInput(deltaTime);
        scene->Update(deltaTime);

        // Render commands...
        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT|GL_DEPTH_BUFFER_BIT);

        //glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES,0,6);
        glBindVertexArray(0);

        // Swap buffers and poll IO events
        window.SwapBuffers();
    }

        // Cleanup is handled by the Window class destructor
        return 0;
}







