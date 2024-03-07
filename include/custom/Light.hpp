 #pragma once
 #include <glm/glm.hpp>
 #include <nlohmann/json.hpp>
 #include "Object.hpp"
 namespace Radi::Types
 {
     struct Light : Object{
        int type;
        float intensity;
        alignas(16) glm::vec4 color;

        static Light* createFromJson(nlohmann::json lightJson);
    };
 } 
 
