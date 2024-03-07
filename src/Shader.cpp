#include <cstring>
#include "Shader.hpp"
#include <glm/glm.hpp>
#include <glm/gtc/type_ptr.hpp>
Radi::Types::Shader::Shader(const char* vertexPath, const char* fragmentPath) {
	std::string vertexCode;
	std::string fragmentCode;
	std::ifstream vShaderFile;
	std::ifstream fShaderFile;

	// ensure ifstream objects can throw exceptions:
	vShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);
	fShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);

    try
    {
        // open files
        vShaderFile.open(vertexPath);
        fShaderFile.open(fragmentPath);
        std::stringstream vShaderStream, fShaderStream;
        // read file's buffer contents into streams
        vShaderStream << vShaderFile.rdbuf();
        fShaderStream << fShaderFile.rdbuf();
        // close file handlers
        vShaderFile.close();
        fShaderFile.close();
        // convert stream into string
        vertexCode = vShaderStream.str();
        fragmentCode = fShaderStream.str();
    }
    catch (std::ifstream::failure e)
    {
        std::cout << "ERROR::SHADER::FILE_NOT_SUCCESFULLY_READ" << std::endl;
    }
    const char* vShaderCode = vertexCode.c_str();
    const char* fShaderCode = fragmentCode.c_str();

    unsigned int vertex, fragment =0;
    int success = 0;
    char infoLog[512];
    memset(infoLog, 512, sizeof(char));

    //VERTEX
    vertex = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertex, 1, &vShaderCode, NULL);
    glCompileShader(vertex);

    glGetShaderiv(vertex, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(vertex, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
    }

    //FRAGMENT
    fragment = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragment, 1, &fShaderCode, NULL);
    glCompileShader(fragment);

    glGetShaderiv(fragment, GL_COMPILE_STATUS, &success);
    if (!success) {
        glGetShaderInfoLog(fragment, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n" << infoLog << std::endl;
    }


    //PROGRAM
    ID = glCreateProgram();
    glAttachShader(ID, vertex);
    glAttachShader(ID, fragment);
    glLinkProgram(ID);

    glGetProgramiv(ID, GL_LINK_STATUS, &success);
    if (!success) {
        glGetProgramInfoLog(ID, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::PROGRAM::LINKING_FAILED\n" << infoLog << std::endl;
    }

    //clean up memory
    glDeleteShader(vertex);
    glDeleteShader(fragment);

}

void Radi::Types::Shader::use() {
    glUseProgram(ID);
}



void Radi::Types::Shader::setBool(const std::string& name, bool value) const {
    glUniform1i(glGetUniformLocation(ID, name.c_str()), (int)value);
}
bool Radi::Types::Shader::getBool(const std::string&name) const{
    auto it = uniformIntegers.find(name);
    if(it!= uniformIntegers.end()){
        return it->second;
    }else{
        std::cerr<<"Uniform '"<<name<<"' not found or not set yet. \n";
        return 0;
    }

}
void Radi::Types::Shader::setInt(const std::string& name, int value) {
    glUniform1i(glGetUniformLocation(ID, name.c_str()), value);
    uniformIntegers[name] = value;
}
int Radi::Types::Shader::getInt(const std::string&name )const{
    auto it = uniformIntegers.find(name);
    if(it != uniformIntegers.end()){
        return it->second;
    }else{
        std::cerr << "Uniform '"<<name << "' not found or not set yet. \n";
        return 0;
    }
}
void Radi::Types::Shader::setFloat(const std::string& name, float value)const {
    glUniform1f(glGetUniformLocation(ID, name.c_str()), value);
}
void Radi::Types::Shader::setVec3(const std::string& name, const glm::vec3& value) const {
    glUniform3f(glGetUniformLocation(ID, name.c_str()), value.x,value.y,value.z);
}
void Radi::Types::Shader::setVec2(const std::string& name, const glm::vec2& value)const{
    glUniform2f(glGetUniformLocation(ID,name.c_str()),value.x,value.y);
}
void Radi::Types::Shader::setMat4(const std::string& name, const glm::mat4& value)const{
    glUniformMatrix4fv(glGetUniformLocation(ID,name.c_str()), 1, GL_FALSE, glm::value_ptr(value));
}
void Radi::Types::Shader::setUniformBlockBinding(const std::string& blockName, GLuint bindingPoint) const {
    // Retrieve the index of the uniform block named 'blockName' in the shader program
    GLuint blockIndex = glGetUniformBlockIndex(ID, blockName.c_str());

    // Check if the block index is valid
    if (blockIndex == GL_INVALID_INDEX) {
        std::cerr << "Uniform block \"" << blockName << "\" not found in shader program.\n";
        return;
    }

    // Bind the uniform block to the specified uniform buffer binding point
    glUniformBlockBinding(ID, blockIndex, bindingPoint);
}
