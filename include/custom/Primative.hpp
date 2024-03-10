#pragma once
#include <vector>
#include <memory>
#include <glad/glad.h> 
#include <GLFW/glfw3.h>
#include <glm/gtc/matrix_transform.hpp> 
#include <nlohmann/json.hpp>
#include "Material.hpp"
namespace Radi::Types {

	enum Shape {
        Sphere,
        Box,
        Triangle,
        Plane
    };

	struct Primative {
		Shape shape;
		glm::vec4 position;
		glm::vec4 scale;
		glm::vec4 rotation;
		std::shared_ptr<Material> material;
		std::vector<glm::vec3> mesh;

		void createMesh();
		static Primative* createFromJson(nlohmann::json objJson){
			Primative* primative = new Primative();
			std::map<std::string, Shape> shapeMap{
				{"Sphere", Sphere},
				{"Box", Box},
				{"Triangle", Triangle},
				{"Plane", Plane}
			};
			primative->shape = shapeMap[objJson["shape"].get<std::string>()];
			primative->position = glm::vec4(
				objJson["position"]["x"].get<float>(),
				objJson["position"]["y"].get<float>(),
				objJson["position"]["z"].get<float>(),
				objJson["position"]["w"].get<float>()
			);
			primative->scale = glm::vec4(
				objJson["scale"]["x"].get<float>(),
				objJson["scale"]["y"].get<float>(),
				objJson["scale"]["z"].get<float>(),
				objJson["scale"]["w"].get<float>()
			);
			primative->rotation = glm::vec4(
				objJson["rotation"]["x"].get<float>(),
				objJson["rotation"]["y"].get<float>(),
				objJson["rotation"]["z"].get<float>(),
				objJson["rotation"]["w"].get<float>()
			);
			return primative;
		}
	};	
} 

