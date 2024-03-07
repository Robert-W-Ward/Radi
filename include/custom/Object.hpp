#pragma once
#include <vector>
#include <memory>
#include <glad/glad.h> 
#include <GLFW/glfw3.h>
#include <glm/gtc/matrix_transform.hpp> 
#include <nlohmann/json.hpp>
#include "Material.hpp"
namespace Radi::Types {
	class Object {
		public:
			glm::mat4 transform;
			std::shared_ptr<Material> material;
			std::vector<glm::vec3> mesh;
			Object(): transform(1.0f), material(nullptr), mesh() {};
			~Object();
			
			void createMesh();
			static Object* createFromJson(nlohmann::json objJson);

			// Prevent copying and assignment
			Object(const Object&) = delete;
			Object& operator=(const Object&) = delete;
	};	
} 

