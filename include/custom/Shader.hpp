#pragma once
#include <glad/glad.h> // include glad to get all the required OpenGL headers

#include <string>
#include <fstream>
#include <sstream>
#include <iostream>
#include <glm/glm.hpp>
#include <map>

namespace Radi::Types {
    struct Shader {
        unsigned int ID;
        std::map<std::string, int> uniformIntegers;
        Shader(const char* vertexPath, const char* fragmentPath);
        void use();
        void setBool(const std::string& name, bool value) const;
        void setInt(const std::string& name, int value);
        int getInt(const std::string& name)const;
        void setFloat(const std::string& name, float value) const;
        void setVec3(const std::string& name, const glm::vec3 &value) const;
        void setVec2(const std::string& name, const glm::vec2 &value) const;
        void setMat4(const std::string& name, const glm::mat4 &value)const;
        void setUniformBlockBinding(const std::string& blockName, GLuint bindingPoint) const;

    };
}
