cmake_minimum_required(VERSION 3.15)

project(Radi)

# Set the CMAKE_RUNTIME_OUTPUT_DIRECTORY
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/bin")

include_directories(include/custom) # This will make cmake look for headers in the entire /include directory
include_directories(include/)
# include_directories(include/glfw) # For example, if you have GLFW headers locally

# Add the source files
add_executable(${PROJECT_NAME} "src/Radi.cpp" "src/glad.c" "src/Object.cpp" "src/Scene.cpp" "src/Shader.cpp" "src/Transform.cpp")

# Find the GLFW package (if using the system-installed GLFW)
find_package(GLFW3 REQUIRED)

# Link against GLFW and any other required libraries
target_link_libraries(${PROJECT_NAME} glfw)

# target_link_libraries(${PROJECT_NAME} glfw OpenGL::GL)
