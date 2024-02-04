#include "Radi.hpp"
#include "Scene.hpp"
#include "glad/glad.h"
#include "GLFW/glfw3.h"
#include "Shader.hpp"
#include "Camera.hpp"
#include <glm/glm.hpp>

const std::string PROJECT_ROOT = "C:\\Users\\Robert Ward\\source\\repos\\Radi\\src";
const int VIEWPORT_X = 800;
const int VIEWPORT_Y = 600;
const int WINDOW_X = 800;
const int WINDOW_Y = 600;

void framebufferSizeCallback(GLFWwindow* window, int width, int height);
void processInput(GLFWwindow* window);
void setupFullscreenQuad(unsigned int &VAO, unsigned int &VBO);
void mouse_callback(GLFWwindow* window, double xpos,double ypos);
void updateCameraRotation(float deltaTime);

glm::vec3 worldUp = glm::vec3(0.0f,1.0f,0.0f);

//Camera
Radi::Types::Camera camera(
    glm::vec3(0.0f,0.0f,0.0f),//Position
    glm::vec3(0.0f,1.0f,0.0f),//Up direction
    glm::vec3(0.0f,0.0f,1.0f),//front Direction
    glm::vec3(1.0f,0.0f,0.0f),//Camera Right direction
    45.0f,
    0.05f,
    -90.0,
    0.0f,
    0.1f
    );

float aspectRatio = static_cast<float>(WINDOW_X) / WINDOW_Y;
float lastX = WINDOW_X / 2.0f, lastY = WINDOW_Y / 2.0f;

bool firstMouse = true;
float deltaTime = 0.0f;
float lastFrame = 0.0f;
int main() {
    // Initialize GLFW
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    

    // Create a windowed mode window and its OpenGL context 
    GLFWwindow* window = glfwCreateWindow(WINDOW_X, WINDOW_Y, "Hello GLFW", NULL, NULL);
    if (!window) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    
    // Make the window's context currentg
    glfwMakeContextCurrent(window);

    //Init glad so that we can Access OpenGL function pointers
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    
    }

    //Handle Resize of window
    glViewport(0, 0, VIEWPORT_X, VIEWPORT_Y);
    glfwSetFramebufferSizeCallback(window, framebufferSizeCallback);
    glfwSetCursorPosCallback(window,mouse_callback);
    glfwSetInputMode(window,GLFW_CURSOR,GLFW_CURSOR_DISABLED);

    Radi::Types::Shader shader((PROJECT_ROOT + "\\shader.vert").c_str(),(PROJECT_ROOT + "\\shader.frag").c_str());

    // Setup fullscreen quad
    unsigned int VAO, VBO;
    setupFullscreenQuad(VAO, VBO);




    // Loop until the user closes the window
    while (!glfwWindowShouldClose(window)) {
        std::cout<< "Pitch: " <<camera.Pitch << " Yaw: "<< camera.Yaw <<std::endl;

        float currenFrame = static_cast<float>(glfwGetTime());
        deltaTime = currenFrame - lastFrame;
        lastFrame = currenFrame;
        //Handle inputs
        //-------------

        camera.Sensitivity = camera.RotationSpeed * deltaTime;
        processInput(window);
       
        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT|GL_DEPTH_BUFFER_BIT);

        shader.use();
        shader.setVec3("cameraPos",camera.Position);
        shader.setVec3("cameraFront",camera.FrontDirection);
        shader.setVec3("cameraRight",camera.RightDir);
        shader.setVec3("cameraUp",camera.UpDir);
        shader.setFloat("fov",camera.Fov);
        shader.setFloat("aspectRatio",aspectRatio);
        shader.setVec2("screenSize", glm::vec2(WINDOW_X, WINDOW_Y)); 

        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, 6); 




        // Swap front and back buffers
        glfwSwapBuffers(window);
        // Poll for and process events
        glfwPollEvents();
    }

    glfwTerminate(); // Clean up and close the window
    return 0;
}



void framebufferSizeCallback(GLFWwindow* window, int width, int height) 
{
    glViewport(0, 0, width, height);
}

void processInput(GLFWwindow* window) {
    const float cameraSpeed = 0.5f*deltaTime; // adjust as needed
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);
    if (glfwGetKey(window,GLFW_KEY_A) == GLFW_PRESS)
        camera.Position.x -= cameraSpeed;
    if (glfwGetKey(window,GLFW_KEY_D) == GLFW_PRESS)
        camera.Position.x += cameraSpeed;
    if (glfwGetKey(window, GLFW_KEY_LEFT_SHIFT) == GLFW_PRESS)
        camera.Position.y -= cameraSpeed;
    if (glfwGetKey(window, GLFW_KEY_SPACE) == GLFW_PRESS)
        camera.Position.y += cameraSpeed;
    if (glfwGetKey(window,GLFW_KEY_S) == GLFW_PRESS)
        camera.Position.z += cameraSpeed;
    if (glfwGetKey(window,GLFW_KEY_W) == GLFW_PRESS)
        camera.Position.z -= cameraSpeed;
}


void mouse_callback(GLFWwindow* window, double xpos,double ypos){
    if (firstMouse) {
        lastX = xpos;
        lastY = ypos;
        firstMouse = false;
    }
    float xoffset = xpos - lastX;
    float yoffset = lastY - ypos; 
    lastX = xpos;
    lastY = ypos;

    xoffset *= camera.Sensitivity;
    yoffset *= camera.Sensitivity;

    camera.Yaw += xoffset;
    camera.Pitch += yoffset;

    // Make sure that when pitch is out of bounds, screen doesn't get flipped
    camera.Pitch = std::max(std::min(camera.Pitch,89.0f),-89.0f);

    camera.UpdateCameraDirection();

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
