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


        void SetCamera(Camera* camera);
        // Input handling
        void ProcessInput(float deltaTime);

    private:
        GLFWwindow* window;
        int width;
        int height;
        const char* title;
        Camera* camera;
        // Prevent copying
        Window(const Window&) = delete;
        Window& operator=(const Window&) = delete;

        static void FramebufferSizeCallback(GLFWwindow* window, int width, int height);
        void ProcessCameraMovement(float deltaTime);
    };
}

