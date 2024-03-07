#include "Window.hpp"
#include "Shader.hpp"
#include <iostream>
namespace Radi::Types
{
    Window::Window(int width, int height, const char *title)
        : glWindow(nullptr), width(width), height(height), title(title), lastX(width / 2.0), lastY(height / 2.0), firstMouse(true) {}
    Window::~Window()
    {
        glfwTerminate();
    }
    bool Window::Initialize()
    {
        if (!glfwInit())
        {
            std::cerr << "Failed to initialize GLFW\n";
            return false;
        }

        glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
        glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
        glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);

        glWindow = glfwCreateWindow(width, height, title, NULL, NULL);

        if (!glWindow)
        {
            std::cerr << "Failed to create GLFW window\n";
            glfwTerminate();
            return false;
        }

        glfwMakeContextCurrent(glWindow);
        glfwSetWindowUserPointer(glWindow, this); // Set user pointer to the Window instance

        if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
        {
            std::cerr << "Failed to initialize GLAD\n";
            return false;
        }

        glfwSetInputMode(glWindow, GLFW_CURSOR, GLFW_CURSOR_DISABLED);

        return true;
    }
    bool Window::ShouldClose() const
    {
        return glfwWindowShouldClose(glWindow);
    }
    void Window::SwapBuffers()
    {
        glfwSwapBuffers(glWindow);
    }
    void Window::PollEvents()
    {
        glfwPollEvents();
    }
    GLFWwindow *Window::GetGLFWWindow()
    {
        return this->glWindow;
    }

    void Window::RegisterFramebufferSizeCallback(const FramebufferSizeCallback &callback)
    {
        framebufferSizeCallbacks.push_back(callback);
    }
    void Window::RegisterMouseCursorPosCallback(const MoveMouseCallback &callback)
    {
        moveMouseCallbacks.push_back(callback);
    }
    void Window::RegisterScrollCallBack(const ScrollWhellCallback &callback)
    {
        scrollCallbacks.push_back(callback);
    }
    void Window::RegisterKeyPressCallback(const KeyPressCallback &callback)
    {
        keyCallbacks.push_back(callback);
    }
    static void FramebufferSizeCallback(GLFWwindow *window, int width, int height)
    {
        Window *windowInstance = (Window *)glfwGetWindowUserPointer(window);
        for (auto &callback : windowInstance->framebufferSizeCallbacks)
        {
            callback(width, height);
        }
    }
    static void MoveMouseCallback(GLFWwindow *window, double xpos, double ypos)
    {
        Window *windowInstance = (Window *)glfwGetWindowUserPointer(window);
        for (auto &callback : windowInstance->moveMouseCallbacks)
        {
            callback(xpos, ypos);
        }
    }
    static void ScrollWhellCallback(GLFWwindow *window, double xoffset, double yoffset)
    {
        Window *windowInstance = (Window *)glfwGetWindowUserPointer(window);
        for (auto &callback : windowInstance->scrollCallbacks)
        {
            callback(xoffset, yoffset);
        }
    }
    static void KeyCallback(GLFWwindow *window, int key, int scancode, int action, int mods)
    {
        Window *windowInstance = (Window *)glfwGetWindowUserPointer(window);
        for (auto &callback : windowInstance->keyCallbacks)
        {
            callback(key, scancode, action, mods);
        }
    }
}
