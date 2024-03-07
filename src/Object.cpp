#include "Object.hpp"

namespace Radi::Types {
	Object::~Object() {}
	// Define createFromJson
	Object* Object::createFromJson(nlohmann::json objJson) {
		return new Object();
	}
}

