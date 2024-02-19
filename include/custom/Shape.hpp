#pragma once
#include <glm/glm.hpp>
#include "Material.hpp"
namespace Radi::Types
{
    struct Shape{
        int type ;//0:sphere, 1:box/plane, 2:TRIANGLE
        alignas(16) glm::vec4 position;
        alignas(16) glm::vec4 dimensions;
        alignas(16) glm::vec4 extra;
        int materialId;
    };
}

