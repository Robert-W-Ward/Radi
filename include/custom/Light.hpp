 #pragma once
 #include <glm/glm.hpp>
 #include <nlohmann/json.hpp>
 #include "Primative.hpp"
 namespace Radi::Types
 {
    enum LightType {
        Point,
        Area,
        Directional
    
    };
    struct alignas(16) Light {
        LightType type;
        Shape shape;
        alignas(16) glm::vec4 color;
        alignas(16) glm::vec3 position;
        alignas(16) glm::vec3 scale;
        alignas(16) glm::vec3 rotation;
        float intensity;

        static Light* createFromJson(nlohmann::json lightJson){
            Light* light = new Light();
            static std::map<std::string, LightType> lightTypeMap = {
                { "Point", Point },
                { "Area", Area },
                { "Directional", Directional }
            };
            light->type = lightTypeMap[lightJson["type"].get<std::string>()];

            static std::map<std::string, Shape> shapeMap{
                { "Sphere", Sphere },
                { "Box", Box },
                { "Triangle", Triangle },
                { "Plane", Plane }
            };
            light->shape = shapeMap[lightJson["shape"].get<std::string>()];

            light->color = glm::vec4(
                lightJson["color"]["r"].get<float>(),
                lightJson["color"]["g"].get<float>(),
                lightJson["color"]["b"].get<float>(),
                lightJson["color"]["a"].get<float>()
            );

            light->position = glm::vec3(
                lightJson["position"]["x"].get<float>(),
                lightJson["position"]["y"].get<float>(),
                lightJson["position"]["z"].get<float>());

            light->scale = glm::vec3(
                lightJson["scale"]["x"].get<float>(),
                lightJson["scale"]["y"].get<float>(),
                lightJson["scale"]["z"].get<float>());

            light->rotation = glm::vec3(
                lightJson["rotation"]["x"].get<float>(),
                lightJson["rotation"]["y"].get<float>(),
                lightJson["rotation"]["z"].get<float>());

            light->intensity = lightJson["intensity"].get<float>();

            return light;
        }
    };
 } 
 
