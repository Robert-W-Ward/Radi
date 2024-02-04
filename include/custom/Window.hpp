#pragma once
#include "glad/glad.h"
#include "GLFW/glfw3.h"
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

        // Input handling
        void ProcessInput();

    private:
        GLFWwindow* window;
        int width;
        int height;
        const char* title;

        // Prevent copying
        Window(const Window&) = delete;
        Window& operator=(const Window&) = delete;

        static void FramebufferSizeCallback(GLFWwindow* window, int width, int height);
    };
}

