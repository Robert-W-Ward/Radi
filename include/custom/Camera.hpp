// Camera.hpp
#pragma once
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <nlohmann/json.hpp>
#include "Object.hpp"
namespace Radi::Types {
    enum Direction {
        FORWARD,
        BACKWARD,
        LEFT,
        RIGHT
    };
    class Camera : Object {
        public:
            // TODO: change camera movement to use transform matrix instead of position
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
            float aperture;
            float focusDistance;
            Camera();
            static Camera* createFromJson(nlohmann::json objJson);

            glm::mat4 GetViewMatrix() const;
            glm::mat4 GetProjectionMatrix(float width, float height) const;

            void ProcessKeyboard(int direction, float deltaTime);
            void ProcessMouseMovement(float xoffset, float yoffset, GLboolean constrainPitch);
            void ProcessFOVChange(double xoffset,double yoffset);
            void ProcessApertureChange(double xoffset,double yoffset);
            void UpdateCameraVectors();
            void SetAspectRatio(float ratio);
        private:
            float aspectRatio;
    };

}

