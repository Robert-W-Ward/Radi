// Camera.hpp
#pragma once
#include "GLFW/glfw3.h"
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

namespace Radi::Types {
    class Camera {
        public:
            glm::vec3 Position;
            glm::vec3 Front;
            glm::vec3 Up;
            glm::vec3 Right;
            glm::vec3 WorldUp;

            float Yaw;
            float Pitch;
            float MovementSpeed;
            float MouseSensitivity;
            float Zoom;
            Camera();

            glm::mat4 GetViewMatrix() const;
            glm::mat4 GetProjectionMatrix(float width, float height) const;

            void ProcessKeyboard(int direction, float deltaTime);
            void ProcessMouseMovement(float xoffset, float yoffset, GLboolean constrainPitch);
            void ProcessFOVChange(double xoffset,double yoffset);
            void UpdateCameraVectors();
    };

}

