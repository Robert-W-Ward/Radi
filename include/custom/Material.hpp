#pragma once
#include "glm/glm.hpp"

namespace Radi::Types
{
    struct alignas(16) Material{
        alignas(16) glm::vec4 color;
        float specular;
        float shininess;
        float reflectivity;
        float transparency;
        float indexOfRefraction;
    };

} 
