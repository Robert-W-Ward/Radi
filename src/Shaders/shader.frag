// Fragment shader (shader.frag)
#version 460 core
out vec4 FragColor;

in vec3 vertexColor; // Input color from the vertex shader

void main() {
    FragColor = vec4(vertexColor, 1.0);
}
