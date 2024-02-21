#pragma once
#include "glad/glad.h"
#include "GLFW/glfw3.h"
#include "Camera.hpp"
#include "Shader.hpp"
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
        void SetKeyPressCallback(GLFWkeyfun callback);

        void SetCamera(Camera* camera);
        void SetActiveShader(Shader* shader);
        // Input handling
        void ProcessInput(float deltaTime );


        GLFWwindow* GetGLFWWindow();
    private:
        GLFWwindow* glWindow;
        int width;
        int height;
        const char* title;
        Camera* camera;
        Shader* shader;
        double lastX,lastY;
        bool firstMouse;
        // Prevent copying
        Window(const Window&) = delete;
        Window& operator=(const Window&) = delete;
        std::map<int,bool> keyStates;
        static void FramebufferSizeCallback(GLFWwindow* window, int width, int height);
        static void CursorPosCallback(GLFWwindow* window, double xpos, double ypos);
        static void ScrollCallback(GLFWwindow* window,double xoffset, double yoffset);
        static void KeyPressCallback(GLFWwindow* window, int key,int scancode, int action, int mods);
        
        void ProcessCameraMovement(float deltaTime);
        void ProcessMouseMovement(double xpos,double ypos);
        void ProcessScrollWheel(double xoffset,double yoffset);
        void ProcessKeyPress(int key,bool isPressed);
    };
}

