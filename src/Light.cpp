#include "Light.hpp"
namespace Radi::Types {
    Light* Light::createFromJson(nlohmann::json lightJson) {
        return new Light();
    }
}   