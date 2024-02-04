#include "Camera.hpp"
#include <glm/glm.hpp>
#include <GLFW/glfw3.h>
#include <iostream>
namespace Radi::Types{

    glm::mat4 Camera::GetViewMatrix()const{
        return glm::lookAt(Position, Position + Front, Up);
    }
    glm::mat4 Camera::GetProjectionMatrix(float width, float height) const{
        return glm::perspective(glm::radians(Zoom), width / height, 0.1f, 100.0f);
    }
    Camera::Camera() {
        Position = glm::vec3(0.0f, 0.0f, 3.0f);
        WorldUp = Up = glm::vec3(0.0f, 1.0f, 0.0f);
        Yaw = -90.0f; 
        Pitch = 0.0f;
        MovementSpeed = 2.5f; // Default value
        MouseSensitivity = 0.1f; // Default value
        Zoom = 45.0f; // Default value
        UpdateCameraVectors();
    }
    void Camera::UpdateCameraVectors() {
        // Calculate the new Front vector
        glm::vec3 front;
        front.x = cos(glm::radians(Yaw)) * cos(glm::radians(Pitch));
        front.y = sin(glm::radians(Pitch));
        front.z = sin(glm::radians(Yaw)) * cos(glm::radians(Pitch));
        Front = glm::normalize(front);

        glm::vec3 right = glm::cross(Front, WorldUp);
        if (glm::length(right) != 0.0f) {
            Right = glm::normalize(right);
        } else {
            // Handle the error, perhaps by reverting to a default 'Right' vector
        }
        glm::vec3 up = glm::cross(Right, Front);
        if (glm::length(up) != 0.0f) {
            Up = glm::normalize(up);
        } else {
            // Handle the error, perhaps by reverting to a default 'Up' vector
        }
    }

    void Camera::ProcessKeyboard(int direction, float deltaTime) {
        std::cout << "X: " <<this->Position.x << "Y: "<<this->Position.y  <<std::endl;
        float velocity = MovementSpeed * deltaTime;
            if (direction == GLFW_KEY_W)
                Position += Front * velocity;
            if (direction == GLFW_KEY_S)
                Position -= Front * velocity;
            if (direction == GLFW_KEY_A)
                Position -= Right * velocity;
            if (direction == GLFW_KEY_D)
                Position += Right * velocity;
            if (direction == GLFW_KEY_SPACE)
                Position += WorldUp * velocity; // Ascend
            if (direction == GLFW_KEY_LEFT_SHIFT)
                Position -= WorldUp * velocity; // Descend    
    }

    void Camera::ProcessMouseMovement(float xoffset, float yoffset, GLboolean constrainPitch) {
        xoffset *= MouseSensitivity;
        yoffset *= MouseSensitivity;

        Yaw   += xoffset;
        Pitch += yoffset;

        if (constrainPitch) {
            if (Pitch > 89.0f)
                Pitch = 89.0f;
            if (Pitch < -89.0f)
                Pitch = -89.0f;
        }

        UpdateCameraVectors();
    }
}