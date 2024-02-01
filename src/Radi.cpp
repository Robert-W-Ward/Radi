#include "Radi.h"
#include "Scene.h"
#include "glad/glad.h"
#include "GLFW/glfw3.h"

const std::string PROJECT_ROOT = "C:\\Users\\Robert Ward\\source\\repos\\Radi\\src";
const int VIEWPORT_X = 800;
const int VIEWPORT_Y = 600;
const int WINDOW_X = 800;
const int WINDOW_Y = 600;

void framebufferSizeCallback(GLFWwindow* window, int width, int height);
void processInput(GLFWwindow* windwo);
std::string LoadShaderFromFile(const std::string path);
Radi::Types::Scene LoadSceneFromFile();
unsigned int SetupShaders();
int main() {
    // Initialize GLFW
    if (!glfwInit()) {
        std::cerr << "Failed to initialize GLFW" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    

    // Create a windowed mode window and its OpenGL context 
    GLFWwindow* window = glfwCreateWindow(WINDOW_X, WINDOW_Y, "Hello GLFW", NULL, NULL);
    if (!window) {
        std::cerr << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    
    // Make the window's context current
    glfwMakeContextCurrent(window);

    //Init glad so that we can Access OpenGL function pointers
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress)) {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    
    }

    //Handle Resize of window
    glViewport(0, 0, VIEWPORT_X, VIEWPORT_Y);
    glfwSetFramebufferSizeCallback(window, framebufferSizeCallback);

    auto shaderProgram = SetupShaders();

    float vertices[] = {
    -0.5f, -0.5f, 0.0f,
     0.5f, -0.5f, 0.0f,
     0.0f,  0.5f, 0.0f
    };
    
    //Create vertices, create buffer, bind buffer
    unsigned int VBO,VAO;

    //VBO -- container for vertex data
    glGenBuffers(1, &VBO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);


    //VAO -- Organizes how VBOs are mean't to be accessed
    glGenVertexArrays(1, &VAO);
    glBindVertexArray(VAO);


    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);


    glBindBuffer(GL_ARRAY_BUFFER, 0);

    glBindVertexArray(0);



    // Loop until the user closes the window
    while (!glfwWindowShouldClose(window)) {
        //Handle inputs
        //-------------
        processInput(window);
       
        //Render
        //-------------
        glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        glUseProgram(shaderProgram);
        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, 3);


        // Swap front and back buffers
        glfwSwapBuffers(window);
        // Poll for and process events
        glfwPollEvents();
    }

    glfwTerminate(); // Clean up and close the window
    return 0;
}



void framebufferSizeCallback(GLFWwindow* windwo, int width, int height) 
{
    glViewport(0, 0, width, height);
}

void processInput(GLFWwindow* window) {
    
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);
}

unsigned int SetupShaders() {
    ///VERTEXT
    //--------
    std::string vertexShaderPath = PROJECT_ROOT + "\\shader.vert";
    std::string vertexShaderString = LoadShaderFromFile(vertexShaderPath);
    const char* vertexShaderSource = vertexShaderString.c_str();

    unsigned int vertexShader = glCreateShader(GL_VERTEX_SHADER);
    glShaderSource(vertexShader, 1, &vertexShaderSource, NULL);
    glCompileShader(vertexShader);

    int vertSuccess;
    char infoLog[512];
    memset(infoLog, 0, sizeof(infoLog));
    glGetShaderiv(vertexShader, GL_COMPILE_STATUS, &vertSuccess);
    if (!vertSuccess) {
        memset(infoLog, 0, sizeof(infoLog));
        glGetShaderInfoLog(vertexShader, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
    }

    ///FRAGMENT
    //---------
    std::string fragmentShaderPath = PROJECT_ROOT + "\\shader.frag";
    std::string fragmentShaderString = LoadShaderFromFile(fragmentShaderPath);
    const char* fragmentShaderSource = fragmentShaderString.c_str();

    unsigned int fragmentShader = glCreateShader(GL_FRAGMENT_SHADER);
    glShaderSource(fragmentShader, 1, &fragmentShaderSource, NULL);
    glCompileShader(fragmentShader);

    int fragSuccess;
    memset(infoLog, 0, sizeof(infoLog));
    glGetShaderiv(fragmentShader, GL_COMPILE_STATUS, &fragSuccess);
    if (!fragSuccess) {
        memset(infoLog, 0, sizeof(infoLog));
        glGetShaderInfoLog(fragmentShader, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n" << infoLog << std::endl;
    } 


    //PROGRAM
    //-------
    unsigned int shaderProgram = glCreateProgram();

    glAttachShader(shaderProgram, vertexShader);
    glAttachShader(shaderProgram, fragmentShader);
    glLinkProgram(shaderProgram);

    int linkSuccess;
    glGetProgramiv(shaderProgram, GL_LINK_STATUS, &linkSuccess);
    memset(infoLog, 0, sizeof(infoLog));
    if (!linkSuccess) {
        glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::PROGRAM::LINK_FAILED\n" << infoLog << std::endl;
    }

    //clean up
    glDeleteShader(vertexShader);
    glDeleteShader(fragmentShader);
    return shaderProgram;
}

std::string LoadShaderFromFile(const std::string path) {
    std::fstream file(path);
    if (!file.is_open()) {
        std::cerr << "Error: Could not open file " << path << std::endl;
        return std::string("Failed to load file");
    }
    std::stringstream buffer;
    buffer << file.rdbuf();
    file.close();

    return buffer.str();
}

