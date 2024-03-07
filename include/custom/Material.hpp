#pragma once
#include "glm/glm.hpp"

namespace Radi::Types
{
    struct alignas(16) Material{
        glm::vec3 ambient;
        glm::vec3 diffuse;
        glm::vec3 specular;
        float shininess;

        static Material* createFromJson(nlohmann::json matJson){return new Material();};
    };
} 
