#include "Object.hpp"

namespace Radi::Types {

	Object::Object() : VAO(0), VBO(0), vertexCount(0) {}

	Object::~Object() {
		glDeleteVertexArrays(1, &VAO);
		glDeleteBuffers(1, &VBO);
	}

	void Object::Initialize(const std::vector<glm::vec3>& vertices,const std::vector<glm::vec3>& colors) {
		vertexCount = vertices.size(); // Update the vertex count
		setupMesh(vertices,colors);
	}

	void Object::Render() const {
		glBindVertexArray(VAO);
		glDrawArrays(GL_TRIANGLES, 0, static_cast<GLsizei>(vertexCount));
		glBindVertexArray(0);
	}

	void Object::setupMesh(const std::vector<glm::vec3>& vertices,const std::vector<glm::vec3>& colors) {
		glGenVertexArrays(1, &VAO);
		glBindVertexArray(VAO);

		glGenBuffers(1, &VBO);
		glBindBuffer(GL_ARRAY_BUFFER,VBO);
		// Since glm::vec3 is essentially an array of three floats, we can directly use &vertices[0] to access its data
		glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(glm::vec3), &vertices[0], GL_STATIC_DRAW);
		// Position attribute
		glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(glm::vec3), (void*)0);
		glEnableVertexAttribArray(0);

		glGenBuffers(1,&CBO);
		glBindBuffer(GL_ARRAY_BUFFER,CBO);
		glBufferData(GL_ARRAY_BUFFER,colors.size()*sizeof(glm::vec3),&colors[0],GL_STATIC_DRAW);
		// Color attribute
    	glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(glm::vec3), (void*)0);
		glEnableVertexAttribArray(1);

		glBindBuffer(GL_ARRAY_BUFFER, 0);
		glBindVertexArray(0);
	}


}

