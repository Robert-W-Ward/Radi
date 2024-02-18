#include <glm/glm.hpp>
#include <iostream>
#include "Radi.hpp"
#include "Scene.hpp"
#include "glad/glad.h"
#include "GLFW/glfw3.h"
#include "Shader.hpp"
#include "Camera.hpp"
#include "Window.hpp"
#include "Shape3D.hpp"
#include "Light.hpp"
#include "Material.hpp"
#include "RayMarchScene.hpp"
#include "nlohmann/json.hpp"

#define SPHERE 0
#define BOX 1
#define TRIANGLE 2
#define PLANE 3

#define POINT_LIGHT 999
#define AREA_LIGHT 998
#define DIRECTIONAL_LIGHT 997
    const std::string PROJECT_ROOT = "C:\\Users\\Robert Ward\\source\\repos\\Radi\\src";
    const int VIEWPORT_X = 1920;
    const int VIEWPORT_Y = 1080;
    const int WINDOW_X = 1920;
    const int WINDOW_Y = 1080;
    const int aspectRatio = static_cast<float>(WINDOW_X)/ static_cast<float>(WINDOW_Y);

    void setupFullscreenQuad(unsigned int &VAO, unsigned int &VBO);
    nlohmann::json loadScene(const std::string& path);
    bool isDebug = false;
    int main() {
        // Specify window dimensions and title
        const int windowWidth = 1920;
        const int windowHeight = 1080;
        const char* windowTitle = "Radi";

        // Create Window instance and context
        Radi::Types::Window window(windowWidth, windowHeight, windowTitle);
    
        // Initialize the window and OpenGL context
        if (!window.Initialize()) {
            std::cerr << "Failed to initialize the window and OpenGL context" << std::endl;
            return -1;
        }
        Radi::Types::Camera camera;
        Radi::Types::Shader shader((PROJECT_ROOT + "\\Shaders\\raytrace.vert").c_str(),(PROJECT_ROOT + "\\shaders\\raytrace.frag").c_str());
        window.SetCamera(&camera);

        Radi::Types::RayMarchScene* RayMarchedScene = new Radi::Types::RayMarchScene();
        RayMarchedScene->LoadSceneFromJson((PROJECT_ROOT + "\\Scenes\\Scene4.json").c_str());

        unsigned int VAO, VBO;
        setupFullscreenQuad(VAO,VBO);
        glEnable(GL_DEPTH_TEST);
        glDepthFunc(GL_LESS);

        float lastFrame = 0.0f;
        float deltaTime = 0.0f;

        auto shapes = RayMarchedScene->GetShapes();
        auto lights = RayMarchedScene->GetLights();
        GLuint ssbo;
        glGenBuffers(1,&ssbo);
        glBindBuffer(GL_SHADER_STORAGE_BUFFER,ssbo);
        glBufferData(GL_SHADER_STORAGE_BUFFER,sizeof(Radi::Types::Shape3D)* shapes->size(),shapes->data(),GL_STATIC_DRAW);
        glBindBufferBase(GL_SHADER_STORAGE_BUFFER,0,ssbo);
        glBindBuffer(GL_SHADER_STORAGE_BUFFER,0);


        GLuint ssbo1;
        glGenBuffers(1,&ssbo1);
        glBindBuffer(GL_SHADER_STORAGE_BUFFER,ssbo1);
        glBufferData(GL_SHADER_STORAGE_BUFFER,sizeof(Radi::Types::Light)* lights->size(),lights->data(),GL_STATIC_DRAW);
        glBindBufferBase(GL_SHADER_STORAGE_BUFFER,1,ssbo1);
        glBindBuffer(GL_SHADER_STORAGE_BUFFER,0);

        bool gKeyWasPressed = false;
        // Main loop
        while (!window.ShouldClose()) {

            float currentFrame = glfwGetTime();
            deltaTime = currentFrame - lastFrame;
            lastFrame = currentFrame;

            // Input handling
            window.ProcessInput(deltaTime);

            // Render commands...
            glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
            glClear(GL_COLOR_BUFFER_BIT|GL_DEPTH_BUFFER_BIT);

            shader.use();
            shader.setVec3("camPos",camera.Position);
            shader.setVec3("camDir",camera.Front);
            shader.setVec3("camUp",camera.Up);
            shader.setVec3("camRight",camera.Right);
            shader.setFloat("camFOV",camera.Zoom);
            shader.setFloat("aspectRatio",aspectRatio);
            shader.setFloat("VP_X",VIEWPORT_X);
            shader.setFloat("VP_Y",VIEWPORT_Y);
            bool gKeyPressed = glfwGetKey(window.GetGLFWWindow(), GLFW_KEY_G)== GLFW_PRESS;
            if ( gKeyPressed && !gKeyWasPressed ){
                std::cout<<"PRESSING G"<<std::endl;
                isDebug = !isDebug;
            }
            gKeyWasPressed = gKeyPressed;  
            shader.setBool("isDebug",isDebug);
            glBindVertexArray(VAO);
            glDrawArrays(GL_TRIANGLES,0,6);
            glBindVertexArray(0);


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









