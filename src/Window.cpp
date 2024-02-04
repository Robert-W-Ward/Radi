#include "Window.hpp"
#include <iostream>
namespace Radi::Types{
    Window::Window(int width, int height, const char* title)
        : window(nullptr), width(width), height(height), title(title),lastX(width/2.0),lastY(height/2.0),firstMouse(true) {}

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

        window = glfwCreateWindow(width, height, title, NULL, NULL);

        if (!window) {
            std::cerr << "Failed to create GLFW window\n";
            glfwTerminate();
            return false;
        }

        glfwMakeContextCurrent(window);
        glfwSetWindowUserPointer(window, this); // Set user pointer to the Window instance
        glfwSetCursorPosCallback(window, Window::CursorPosCallback); // Set the mouse callback
        glfwSetFramebufferSizeCallback(window, Window::FramebufferSizeCallback);

        if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
            std::cerr << "Failed to initialize GLAD\n";
            return false;
        }

        glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);

        return true;
    }
    void Window::SetCamera(Radi::Types::Camera* camera){
        this->camera = camera;
    }
    bool Window::ShouldClose() const {
        return glfwWindowShouldClose(window);
    }
    void Window::SwapBuffers() {
        glfwSwapBuffers(window);
    }
    void Window::PollEvents() {
        glfwPollEvents();
    }

    void Window::ProcessInput(float deltaTime ) {
        if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
            glfwSetWindowShouldClose(window, true);
        ProcessCameraMovement(deltaTime);   
    }

    void Window::SetFramebufferSizeCallback(GLFWframebuffersizefun callback) {
        glfwSetFramebufferSizeCallback(window, callback);
    }
    void Window::FramebufferSizeCallback(GLFWwindow* window, int width, int height) {   
        glViewport(0, 0, width, height);
    }

    void Window::SetMouseCursorPosCallback(GLFWcursorposfun callback){
        glfwSetCursorPosCallback(window, callback);
    }
    void Window::CursorPosCallback(GLFWwindow* window, double xpos, double ypos){
        // Retrieve the window instance from GLFW user pointer
        Window* windowInstance = static_cast<Window*>(glfwGetWindowUserPointer(window));
        if (windowInstance) {
            windowInstance->ProcessMouseMovement(xpos, ypos);
        }
    }
    
    void Window::ProcessCameraMovement(float deltaTime) {
        if (!camera) return; // Ensure there's a camera

        // Example movement processing
        if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
            camera->ProcessKeyboard(GLFW_KEY_W, deltaTime);
        if (glfwGetKey(window,GLFW_KEY_A) == GLFW_PRESS)
            camera->ProcessKeyboard(GLFW_KEY_A, deltaTime);
        if (glfwGetKey(window,GLFW_KEY_S) == GLFW_PRESS)
            camera->ProcessKeyboard(GLFW_KEY_S, deltaTime);
        if (glfwGetKey(window,GLFW_KEY_D) == GLFW_PRESS)
            camera->ProcessKeyboard(GLFW_KEY_D, deltaTime);
        if (glfwGetKey(window,GLFW_KEY_SPACE) == GLFW_PRESS)
            camera->ProcessKeyboard(GLFW_KEY_SPACE,deltaTime);
        if (glfwGetKey(window,GLFW_KEY_LEFT_SHIFT) == GLFW_PRESS)
            camera->ProcessKeyboard(GLFW_KEY_LEFT_SHIFT,deltaTime);
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
}
