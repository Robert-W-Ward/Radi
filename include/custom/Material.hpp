#pragma once
#include "glm/glm.hpp"

namespace Radi::Types
{

    enum MaterialType {
        Lambertian,
        Specular,
        Glossy,
        Dielectric,
        Metal,
        Emissive
    };
    struct alignas(16) Material{
        int id;
        MaterialType type;
        alignas(16) glm::vec4 ambient;
        alignas(16) glm::vec4 diffuse;
        alignas(16) glm::vec4 specular;
        alignas(16) glm::vec4 color;
        float shininess;
        float albedo;
        float reflectivity;

        static Material* createFromJson(nlohmann::json matJson){
            Material* mat = new Material();
            mat->id = matJson["id"].get<int>();
            // read in type as a string and convert to enum
            std::map<std::string, MaterialType> typeMap{
                {"Lambertian", Lambertian}, 
                {"Specular", Specular}, 
                {"Glossy", Glossy}, 
                {"Dielectric", Dielectric}, 
                {"Metal", Metal}, 
                {"Emissive", Emissive}
            };
            mat->type = typeMap[matJson["type"].get<std::string>()];
            mat->color = glm::vec4(
                matJson["color"]["r"].get<float>(),
                matJson["color"]["g"].get<float>(),
                matJson["color"]["b"].get<float>(),
                matJson["color"]["a"].get<float>()
            );
            
            mat->ambient = glm::vec4(
                matJson["ambient"]["r"].get<float>(),
                matJson["ambient"]["g"].get<float>(),
                matJson["ambient"]["b"].get<float>(),
                matJson["ambient"]["a"].get<float>()
            );

            mat->diffuse = glm::vec4(
                matJson["diffuse"]["r"].get<float>(),
                matJson["diffuse"]["g"].get<float>(),
                matJson["diffuse"]["b"].get<float>(),
                matJson["diffuse"]["a"].get<float>()
            );

            mat->specular = glm::vec4(
                matJson["specular"]["r"].get<float>(),
                matJson["specular"]["g"].get<float>(),
                matJson["specular"]["b"].get<float>(),
                matJson["specular"]["a"].get<float>()
            );
            
            mat->shininess = matJson["shininess"].get<float>();
            mat->albedo = matJson["albedo"].get<float>();
            mat->reflectivity = matJson["reflectivity"].get<float>();
            return mat;
        };
    };
} 
