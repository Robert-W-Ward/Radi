#include <glm/glm.hpp>
#include <iostream>
#include "Radi.hpp"
#include "Scene.hpp"
#include "glad/glad.h"
#include "GLFW/glfw3.h"
#include "Shader.hpp"
#include "Camera.hpp"
#include "Window.hpp"
#include "nlohmann/json.hpp"

#define SPHERE 0
#define BOX 1
#define TRIANGLE 2

const std::string PROJECT_ROOT = "C:\\Users\\Robert Ward\\source\\repos\\Radi\\src";
const int VIEWPORT_X = 800;
const int VIEWPORT_Y = 600;
const int WINDOW_X = 800;
const int WINDOW_Y = 600;
const int aspectRatio = static_cast<float>(WINDOW_X)/ static_cast<float>(WINDOW_Y);
void setupFullscreenQuad(unsigned int &VAO, unsigned int &VBO);
nlohmann::json loadScene(const std::string& path);

struct alignas(16) Material{
    alignas(16) glm::vec4 color;
    float specular;
    float shininess;
    float reflectivity;
};

struct Shape3D{
    int type ;//0:sphere, 1:box/plane, 2:TRIANGLE
    alignas(16) glm::vec4 position;
    alignas(16) glm::vec4 dimensions;
    Material material;
    alignas(16) glm::vec4 extra;
};


int main() {
    // Specify window dimensions and title
    const int windowWidth = 800;
    const int windowHeight = 600;
    const char* windowTitle = "Radi";


    // Create Window instance and context
    Radi::Types::Window window(windowWidth, windowHeight, windowTitle);
   
    // Initialize the window and OpenGL context
    if (!window.Initialize()) {
        std::cerr << "Failed to initialize the window and OpenGL context" << std::endl;
        return -1;
    }
    Radi::Types::Camera camera;
    Radi::Types::Shader shader((PROJECT_ROOT + "\\raytrace.vert").c_str(),(PROJECT_ROOT + "\\raytrace.frag").c_str());
    window.SetCamera(&camera);

    std::string scenePath = PROJECT_ROOT + "\\RasterScene.json";

    Radi::Types::Scene* scene = new Radi::Types::Scene();
    scene->LoadSceneFromJson(scenePath);


    unsigned int VAO, VBO;
    setupFullscreenQuad(VAO,VBO);
    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LESS);

    std::vector<Shape3D> shapes = {
        {
            SPHERE,
            glm::vec4(-3.0,0.0,0.0,0.0),
            glm::vec4(1.0,0.0,0.0,0.0),
            {glm::vec4(0.8,1.0,0.0,1.0),
            0.5,//specular
            32.0,//shininess
            0.0//Reflectivity
            }
        },
        {
            BOX,
            glm::vec4(0.0,-3.0,0.0,0.0),
            glm::vec4(10.0,0.5,10.0,0.0),
            {glm::vec4(0.0,1.0,0.0,1.0),
            0.5,
            1.0,
            1.0
            }
        },
        // {
        //     TRIANGLE,
        //     glm::vec4(0.0,0.0,-5.0,0.0),
        //     glm::vec4(1.0,0.0,0.0,0.0),
        //     {glm::vec4(0.0,0.0,1.0,0.0),1.0,32.0},
        //     glm::vec4(0.0,2.0,.0,1.0)
        // }
    };

    float lastFrame = 0.0f;
    float deltaTime = 0.0f;


    GLuint ssbo;
    glGenBuffers(1,&ssbo);
    glBindBuffer(GL_SHADER_STORAGE_BUFFER,ssbo);
    glBufferData(GL_SHADER_STORAGE_BUFFER,sizeof(Shape3D)*shapes.size(),&shapes.at(0),GL_STATIC_DRAW);
    glBindBufferBase(GL_SHADER_STORAGE_BUFFER,0,ssbo);
    glBindBuffer(GL_SHADER_STORAGE_BUFFER,0);
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
        shader.setVec3("POINT_LIGHT_POS",glm::vec3(0.0,3.0,0.0));
        shader.setFloat("aspectRatio",aspectRatio);
        shader.setFloat("VP_X",VIEWPORT_X);
        shader.setFloat("VP_Y",VIEWPORT_Y);
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
