#include "Window.hpp"
#include "Shader.hpp"
#include <iostream>
namespace Radi::Types{
    Window::Window(int width, int height, const char* title)
        : glWindow(nullptr), width(width), height(height), title(title),lastX(width/2.0),lastY(height/2.0),firstMouse(true) {}

    Window::~Window() {
        glfwTerminate();
    }
    bool Window::Initialize() {
        if (!glfwInit()) {
            std::cerr << "Failed to initialize GLFW\n";
            return false;
        }

        glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
        glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
        glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

        glWindow = glfwCreateWindow(width, height, title, NULL, NULL);

        if (!glWindow) {
            std::cerr << "Failed to create GLFW window\n";
            glfwTerminate();
            return false;
        }

        glfwMakeContextCurrent(glWindow);
        glfwSetWindowUserPointer(glWindow, this); // Set user pointer to the Window instance
        glfwSetCursorPosCallback(glWindow, Window::CursorPosCallback); // Set the mouse callback
        glfwSetFramebufferSizeCallback(glWindow, Window::FramebufferSizeCallback);
        glfwSetScrollCallback(glWindow,Window::ScrollCallback);
        glfwSetKeyCallback(glWindow,Window::KeyPressCallback);

        if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
            std::cerr << "Failed to initialize GLAD\n";
            return false;
        }

        glfwSetInputMode(glWindow, GLFW_CURSOR, GLFW_CURSOR_DISABLED);

        return true;
    }
    void Window::SetCamera(Radi::Types::Camera* camera){
        this->camera = camera;
    }
    void Window::SetActiveShader(Radi::Types::Shader* shader){
        this->shader = shader;
    }
    bool Window::ShouldClose() const {
        return glfwWindowShouldClose(glWindow);
    }
    void Window::SwapBuffers() {
        glfwSwapBuffers(glWindow);
    }
    void Window::PollEvents() {
        glfwPollEvents();
    }

    void Window::ProcessInput(float deltaTime) {
        if (glfwGetKey(glWindow, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(glWindow, true);
        if (glfwGetKey(glWindow,GLFW_KEY_4) == GLFW_PRESS)
            std::cout<<"KEY PRESSED\n";
        ProcessCameraMovement(deltaTime);
    }
    void Window::SetFramebufferSizeCallback(GLFWframebuffersizefun callback) {
        glfwSetFramebufferSizeCallback(glWindow, callback);
    }
    void Window::FramebufferSizeCallback(GLFWwindow* window, int width, int height) {   
        glViewport(0, 0, width, height);
    }


    void Window::SetMouseCursorPosCallback(GLFWcursorposfun callback){
        glfwSetCursorPosCallback(glWindow, callback);
    }
    void Window::CursorPosCallback(GLFWwindow* window, double xpos, double ypos){
        // Retrieve the window instance from GLFW user pointer
        Window* windowInstance = static_cast<Window*>(glfwGetWindowUserPointer(window));
        if (windowInstance) {
            windowInstance->ProcessMouseMovement(xpos, ypos);
        }
    }
    void Window::ProcessMouseMovement(double xpos, double ypos) {
        if (firstMouse) {
            lastX = xpos;
            lastY = ypos;
            firstMouse = false;
        }

        double xoffset = xpos - lastX;
        double yoffset = lastY - ypos; // Reversed since y-coordinates go from bottom to top
        lastX = xpos;
        lastY = ypos;

        if (camera) {
            camera->ProcessMouseMovement(xoffset, yoffset,GL_TRUE);
        }
    }
    
    void Window::SetScrollCallBack(GLFWscrollfun callback){
        glfwSetScrollCallback(glWindow,callback);
    }
    void Window::ScrollCallback(GLFWwindow* window, double xoffset, double yoffset){
        Window* windowInstance = static_cast<Window*>(glfwGetWindowUserPointer(window));
        if(windowInstance){
            windowInstance->ProcessScrollWheel(xoffset,yoffset);
        }
    }
    void Window::ProcessScrollWheel(double xoffset,double yoffset){
        if (glfwGetKey(glWindow, GLFW_KEY_LEFT_CONTROL) == GLFW_PRESS || 
            glfwGetKey(glWindow, GLFW_KEY_RIGHT_CONTROL) == GLFW_PRESS) {
            camera->ProcessFOVChange(xoffset,yoffset);
        }else if(glfwGetKey(glWindow,GLFW_KEY_LEFT_ALT)){
            camera->ProcessApertureChange(xoffset,yoffset);
        }
    }
    
    void Window::SetKeyPressCallback(GLFWkeyfun callback){
        glfwSetKeyCallback(glWindow,callback);
    }
    void Window::KeyPressCallback(GLFWwindow* window, int key,int scancode, int action, int mods){
        Window* windowInstance = static_cast<Window*>(glfwGetWindowUserPointer(window));

        if(windowInstance){
            if(action == GLFW_PRESS){
                windowInstance->ProcessKeyPress(key,true);
            }else if(action == GLFW_RELEASE){
                windowInstance->ProcessKeyPress(key,false);
            }
        }
    }
   
    void Window::ProcessKeyPress(int key,bool isPressed){
        int value = shader->getInt("u_samplesPerPixel");
        if(keyStates[key]!=isPressed){
            keyStates[key] = isPressed;
            if(isPressed){
                switch (key) {
                    case GLFW_KEY_1:
                        value++;
                        shader->setInt("u_samplesPerPixel", value);
                        std::cout<<"Increased samples to: "<< value << "\n";
                        break;
                    case GLFW_KEY_2:
                        value--;
                        shader->setInt("u_samplesPerPixel", value);
                        std::cout<<"Decreased samples to: "<< value << "\n";
                        break;
                    default:
                        break;
                }
            }
            
        }       
    }
    
    void Window::ProcessCameraMovement(float deltaTime) {
        if (!camera) return; // Ensure there's a camera

        if (glfwGetKey(glWindow, GLFW_KEY_W) == GLFW_PRESS)
            camera->ProcessKeyboard(GLFW_KEY_W, deltaTime);
        if (glfwGetKey(glWindow,GLFW_KEY_A) == GLFW_PRESS)
            camera->ProcessKeyboard(GLFW_KEY_A, deltaTime);
        if (glfwGetKey(glWindow,GLFW_KEY_S) == GLFW_PRESS)
            camera->ProcessKeyboard(GLFW_KEY_S, deltaTime);
        if (glfwGetKey(glWindow,GLFW_KEY_D) == GLFW_PRESS)
            camera->ProcessKeyboard(GLFW_KEY_D, deltaTime);
        if (glfwGetKey(glWindow,GLFW_KEY_SPACE) == GLFW_PRESS)
            camera->ProcessKeyboard(GLFW_KEY_SPACE,deltaTime);
        if (glfwGetKey(glWindow,GLFW_KEY_LEFT_SHIFT) == GLFW_PRESS)
            camera->ProcessKeyboard(GLFW_KEY_LEFT_SHIFT,deltaTime);
    }
    
    
    
    
    GLFWwindow* Window::GetGLFWWindow(){
        return this->glWindow;
    }
}
