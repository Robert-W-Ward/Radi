#pragma once
#include "glad/glad.h"
#include "GLFW/glfw3.h"
#include "Camera.hpp"
namespace Radi::Types{
    class Window {
    public:
        Window(int width, int height, const char* title);
        ~Window();

        bool Initialize();
        bool ShouldClose() const;
        void SwapBuffers();
        void PollEvents();

        // Callback setters
        void SetFramebufferSizeCallback(GLFWframebuffersizefun callback);
        void SetMouseCursorPosCallback(GLFWcursorposfun callback);
        void SetScrollCallBack(GLFWscrollfun callback);


        void SetCamera(Camera* camera);
        // Input handling
        void ProcessInput(float deltaTime );


        GLFWwindow* GetGLFWWindow();
    private:
        GLFWwindow* glWindow;
        int width;
        int height;
        const char* title;
        Camera* camera;
        double lastX,lastY;
        bool firstMouse;
        // Prevent copying
        Window(const Window&) = delete;
        Window& operator=(const Window&) = delete;

        static void FramebufferSizeCallback(GLFWwindow* window, int width, int height);
        static void CursorPosCallback(GLFWwindow* window, double xpos, double ypos);
        static void ScrollCallback(GLFWwindow* window,double xoffset, double yoffset);
        
        
        void ProcessCameraMovement(float deltaTime);
        void ProcessMouseMovement(double xpos,double ypos);
        void ProcessScrollWheel(double xoffset,double yoffset);
    };
}

