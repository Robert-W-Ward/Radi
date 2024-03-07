cmake_minimum_required(VERSION 3.15)

project(Radi)

# Set the CMAKE_RUNTIME_OUTPUT_DIRECTORY
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")

include(FetchContent)

FetchContent_Declare(
	glm
	GIT_REPOSITORY	https://github.com/g-truc/glm.git
	GIT_TAG 	    bf71a834948186f4097caa076cd2663c69a10e1e #refs/tags/0.9.9.8
)

FetchContent_MakeAvailable(glm)

include_directories(include/custom) # This will make cmake look for headers in the entire /include directory
include_directories(include/)
# include_directories(include/glfw) # For example, if you have GLFW headers locally

# Add the source files
add_executable(${PROJECT_NAME} "src/Radi.cpp" "src/glad.c" "src/Scene.cpp" "src/Object.cpp" "src/Shader.cpp" "src/Transform.cpp" "src/Camera.cpp" "src/Window.cpp" "src/Light.cpp")

# Find the GLFW package (if using the system-installed GLFW)
find_package(GLFW3 REQUIRED)

# Link against GLFW and any other required libraries
target_link_libraries(${PROJECT_NAME} glfw glm::glm)
# target_link_libraries(${PROJECT_NAME} glfw OpenGL::GL)
