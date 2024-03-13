// Camera.hpp
#pragma once
#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <nlohmann/json.hpp>
#include "GLFW/glfw3.h"
namespace Radi::Types {
    enum Direction {
        FORWARD,
        BACKWARD,
        LEFT,
        RIGHT
    };
    struct alignas(16) Camera {
        // TODO: change camera movement to use transform matrix instead of position
        alignas(16) glm::vec3 Position;
        alignas(16) glm::vec3 Front;
        alignas(16) glm::vec3 Up;
        alignas(16) glm::vec3 Right;
        alignas(16) glm::vec3 WorldUp;
        float fov;
        float aspectRatio;
        float focuseDistance;
        float aperture;

        static Camera* createFromJson(nlohmann::json objJson){
            Camera* cam = new Camera();
            cam->Position = glm::vec3(
                objJson["position"]["x"].get<float>(),
                objJson["position"]["y"].get<float>(),
                objJson["position"]["z"].get<float>()
            );
            cam->Front = glm::vec3(
                objJson["front"]["x"].get<float>(),
                objJson["front"]["y"].get<float>(),
                objJson["front"]["z"].get<float>()
            );
            cam->Up = glm::vec3(
                objJson["up"]["x"].get<float>(),
                objJson["up"]["y"].get<float>(),
                objJson["up"]["z"].get<float>()
            );
            cam->Right = glm::vec3(
                objJson["right"]["x"].get<float>(),
                objJson["right"]["y"].get<float>(),
                objJson["right"]["z"].get<float>()
            );
            cam->WorldUp = glm::vec3(
                objJson["worldUp"]["x"].get<float>(),
                objJson["worldUp"]["y"].get<float>(),
                objJson["worldUp"]["z"].get<float>()
            );
            cam->fov = objJson["fov"].get<float>();
            cam->aspectRatio = objJson["aspectRatio"].get<float>();
            cam->focuseDistance = objJson["focusDistance"].get<float>();
            cam->aperture = objJson["aperture"].get<float>();
            return cam;
        };
    };

}

