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

uniform vec3 camPos;          // Camera position
uniform vec3 camDir;          // Camera direction
uniform vec3 camUp;           // Camera up vector
uniform vec3 camRight;        // Camera right vector
uniform float camFOV;         // Camera field of view
uniform float aspectRatio;    // Aspect ratio of the window
uniform float focusDistance;  // Focus distance from the camera
uniform float aperture;
uniform int VP_X;           // Viewport X
uniform int VP_Y;           // Viewport Y
uniform bool isDebug;
uniform int u_samplesPerPixel;
uniform float time;
uniform bool motionBlurActive;

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
    vec3 worldUp;
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

struct Quaternion{
    float w;
    vec3 xyz;
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
layout(std430, binding = 3) buffer CameraBuffer{
    Camera camera;
};

Quaternion quatMultiply(Quaternion q1,Quaternion q2){
    return Quaternion(
        q1.w * q2.w - dot(q1.xyz, q2.xyz),
        q1.w * q2.xyz + q2.w * q1.xyz + cross(q1.xyz, q2.xyz));
}

Quaternion quatConjugate(Quaternion q) {
    return Quaternion(q.w, -q.xyz);
}
Quaternion quatNormalize(Quaternion q){
    float len = sqrt(q.w*q.w + dot(q.xyz, q.xyz));
    return Quaternion(q.w / len, q.xyz / len);
}

vec3 rotatePointByQuaternion(vec3 point, Quaternion q) {
    Quaternion p = Quaternion(0, point);
    q = quatNormalize(q);
    Quaternion qInv = quatConjugate(q);
    Quaternion pRot = quatMultiply(quatMultiply(p, q), qInv);
    return pRot.xyz;
}

vec3 inverseTranslate(vec3 point,vec3 translation){
    return point - translation;
}
vec3 inverseScale(vec3 point,vec3 scale){
    return point / scale;
}
vec3 inverseRotate(vec3 point, vec4 rotation) {
    Quaternion rotationQuat = Quaternion(rotation.w, rotation.xyz);
    return rotatePointByQuaternion(point, rotationQuat);
}


float SphereSDF(vec3 point,vec3 center,out Material hitMaterial,vec3 scale,vec4 rotation,vec3 translation){
    vec3 localPoint = inverseTranslate(point,translation);
    localPoint = inverseScale(localPoint, scale);
    localPoint = inverseRotate(localPoint,rotation);

    float distance = length(localPoint - center) - 1.0;

    Material material = materials[primatives[0].materialId];

    return distance;
}



float SceneSDF(vec3 point,out Material hitMaterial){
    return SphereSDF(point,vec3(0.0),hitMaterial,vec3(1.0),vec4(0.0),vec3(0.0));
}


vec3 getRayDir(vec2 screenCoords){
    float scale = tan(radians(camFOV*0.5));
    vec2 screenPos = screenCoords * scale;
    screenPos.x *= aspectRatio;
    return normalize(camRight*screenPos.x + camUp * screenPos.y + camDir);
}
void main() {
    vec2 screenCoords = (gl_FragCoord.xy / vec2(VP_X, VP_Y)) * 2.0 - 1.0;
    // if(camera.aperture > 0.0){
    //     FragColor = vec4(0.0,1.0,0.0,1.0);
    //     return;
    // }else{
    //     FragColor = vec4(1.0,0.0,0.0,1.0);
    //     return ;
    // }
    FragColor = vec4(screenCoords, 0.0, 1.0);
}   
