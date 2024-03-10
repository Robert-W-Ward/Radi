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
        static Window& Get(){
            static Window window(1280, 720, "Radi");
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

