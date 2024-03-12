// raytrace.frag
#version 460 core
const int MAX_SHAPES = 50;
#define SPHERE 0
#define BOX 1
#define TRIANGLE 2
#define PLANE 3
#define POINT_LIGHT 999
#define RECTANGLE_LIGHT 998
#define DIRECTIONAL 997
#define DISC 996
out vec4 FragColor;
const int MAX_REFLECTION_DEPTH = 3;
float virtualTime;
vec4 BackgroundColor = vec4(0.5,0.5,0.5,1.0);
struct Material{
    int id;
    int type;
    vec4 color;
    vec4 ambient;
    vec4 diffuse;
    vec4 specular;
    float shininess;
    float albedo;
    float reflectivity;
};
struct Primative{
    int shape;
    vec4 position;
    vec4 scale;
    vec4 rotation;
    int materialId;
};

struct Camera{
    vec3 position;
    vec3 lookAt;
    vec3 up;
    vec3 right;
    float fov;
    float aspectRatio;
    float focusDistance;
    float aperture;
};

struct Hit{
    vec3 normal;
    Material material;
    vec3 point;
    float distance;
    vec4 accumulatedColor;
};
struct Light{
    int type;
    int shape;
    vec4 color;
    vec3 position;
    vec3 scale;
    vec3 rotation;
    float intensity;
};

layout(std430, binding = 0) buffer PrimativeBuffer{ 
    Primative primatives[];
};
layout(std430, binding = 1) buffer MaterialBuffer{
    Material materials[];
};
layout(std430, binding = 2) buffer LightBuffer{
    Light lights[];
};

uniform vec3 camPos;          // Camera position
uniform vec3 camDir;          // Camera direction
uniform vec3 camUp;           // Camera up vector
uniform vec3 camRight;        // Camera right vector
uniform float camFOV;         // Camera field of view
uniform float aspectRatio;    // Aspect ratio of the window
uniform float focusDistance;  // Focus distance from the camera
uniform float aperture;
uniform float VP_X;           // Viewport X
uniform float VP_Y;           // Viewport Y
uniform bool isDebug;
uniform int u_samplesPerPixel;
uniform float time;
uniform bool motionBlurActive;

vec3 getRayDir(vec2 screenCoords){
    float scale = tan(radians(camFOV*0.5));
    vec2 screenPos = screenCoords * scale;
    screenPos.x *= aspectRatio;
    return normalize(camRight*screenPos.x + camUp * screenPos.y + camDir);
}
void main() {
    FragColor = vec4(lights[0].intensity);
    // //screen setup
    // vec2 screenCoords = (gl_FragCoord.xy / vec2(VP_X, VP_Y)) * 2.0 - 1.0;
    // vec3 ro = camPos;
    // vec3 rd = getRayDir(screenCoords);
    // if(VP_X > 0.0){
    //     FragColor = vec4(0.0, 1.0, 0.0, 1.0);
    // }else{
    //     FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    // }
    // FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}   