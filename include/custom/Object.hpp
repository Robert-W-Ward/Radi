#pragma once
#include <vector>
#include <glad/glad.h> 
#include <GLFW/glfw3.h>
#include <glm/vec3.hpp>
namespace Radi::Types {

	class Object {
		public:
			Object();
			~Object();

			// Prevent copying and assignment
			Object(const Object&) = delete;
			Object& operator=(const Object&) = delete;

			void Initialize(const std::vector<glm::vec3>& vertices,const std::vector<glm::vec3>& colors);
			void Render() const;

		private:
			unsigned int VAO, VBO,CBO;
			size_t vertexCount; // Keep track of the number of vertices

			void setupMesh(const std::vector<glm::vec3>& vertices, const std::vector<glm::vec3>& color);
		};

} 

