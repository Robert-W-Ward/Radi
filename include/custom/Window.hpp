#pragma once
#include "glad/glad.h"
#include "GLFW/glfw3.h"
#include "Camera.hpp"
#include "Shader.hpp"
namespace Radi::Types{
    class Window {
    public:
        Window(const Window&) = delete;
        Window& operator=(const Window&) = delete;
        static Window& Get(int width = 1280, int height = 720, const char* title = "Radi") {
            static Window window(width, height, title);
            return window;
        }

        bool Initialize();
        bool ShouldClose() const;
        void SwapBuffers();
        void PollEvents();

        typedef std::function<void(int,int)> FramebufferSizeCallback;
        typedef std::function<void(double,double)> MoveMouseCallback;
        typedef std::function<void(double,double)> ScrollWhellCallback;
        typedef std::function<void(int,int,int,int)> KeyPressCallback;

        std::vector<FramebufferSizeCallback> framebufferSizeCallbacks;
        std::vector<MoveMouseCallback> moveMouseCallbacks;
        std::vector<ScrollWhellCallback> scrollCallbacks;
        std::vector<KeyPressCallback> keyCallbacks;

        // Register callbacks
        void RegisterFramebufferSizeCallback(const FramebufferSizeCallback& callback);
        void RegisterMouseCursorPosCallback(const MoveMouseCallback& callback);
        void RegisterScrollCallBack(const ScrollWhellCallback& callback);
        void RegisterKeyPressCallback(const KeyPressCallback& callback);

        GLFWwindow* GetGLFWWindow();

        static void FramebufferSizeCallbackBridge(GLFWwindow *window, int width, int height)
        {
            Window *windowInstance = (Window *)glfwGetWindowUserPointer(window);

            // Update viewport to match window
            glViewport(0, 0, width, height);
            for (auto &callback : windowInstance->framebufferSizeCallbacks)
            {
                callback(width, height);
            }
        }
    private:
        Window(int width, int height, const char* title);
        ~Window();
        GLFWwindow* glWindow;
        bool initialized;
        int width;
        int height;
        const char* title;
        double lastX,lastY;
        bool firstMouse;
        bool motionBlurActive;
    };
}

