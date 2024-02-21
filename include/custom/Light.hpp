 #pragma once
 #include <glm/glm.hpp>
 namespace Radi::Types
 {
     struct Light{
        int type;
        alignas(16) glm::vec4 position;
        alignas(16) glm::vec4 direction;
        alignas(16) glm::vec4 color;
        alignas(16) glm::vec4 dimensions;
        float intensity;
    };
 } 
 
