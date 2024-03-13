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
    vec3 front;
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
    int materialId;
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

float SphereSDF(vec3 point,vec3 center,vec3 scale,vec4 rotation,vec3 translation,out int materialId){
    // vec3 localPoint = inverseTranslate(point,translation);
    // localPoint = inverseScale(localPoint, scale);
    // localPoint = inverseRotate(localPoint,rotation);

    float distance = length(point - center) - 1.0;

    materialId = primatives[0].materialId;

    return distance;
}

float ssdf(vec3 point, vec3 center ,float radius){
    return length(point - center) - radius;
}


float SceneSDF(vec3 point,out int materialId){
    //Loop over all shapes and return the minimum distance
    float minDistance = 1000000.0;
    float distance = 1000000.0;
    for(int i = 0; i < primatives.length(); ++i){
        int matId;
        switch(primatives[i].shape){
            case SPHERE:
                matId = primatives[i].materialId;
                distance = SphereSDF(point,primatives[i].position.xyz,primatives[i].scale.xyz,primatives[i].rotation,vec3(0.0),matId);
            break;
        }
        if(distance < minDistance){
            minDistance = distance;
            materialId = primatives[i].materialId;
        }
    }
    return minDistance;
}


vec3 getRayDir(vec2 screenCoords){
    float scale = tan(radians(camera.fov*0.5));
    vec2 screenPos = screenCoords * scale;
    screenPos.x *= camera.aspectRatio;
    return normalize(camera.right*screenPos.x + camera.worldUp * screenPos.y + camera.front);
}
vec3 CalculateNormal(vec3 p, float epsilon) {
    const vec3 dx = vec3(epsilon, 0.0, 0.0);
    const vec3 dy = vec3(0.0, epsilon, 0.0);
    const vec3 dz = vec3(0.0, 0.0, epsilon);
    int m = 0;
    float d = SceneSDF(p,m);
    vec3 n = vec3(
        SceneSDF(p + dx,m) - d,
        SceneSDF(p + dy,m) - d,
        SceneSDF(p + dz,m) - d
    );

    return normalize(n);
}

void rayMarch(vec3 rayOrigin, vec3 rayDir,float maxDist, float minDist,out Hit hit) {
    float distanceTraveled = 0.0;
    int materialId = 0;
    for(int i = 0; i < 100; ++i){
        vec3 curPos = rayOrigin + rayDir * distanceTraveled;
        float nearestDist = SceneSDF(curPos,materialId);
        if(nearestDist < minDist){
            hit.distance = distanceTraveled;
            hit.point = curPos;
            hit.normal = CalculateNormal(curPos,0.001);
            hit.materialId = materialId;
            break;
        }
        distanceTraveled += nearestDist;
        if(distanceTraveled > maxDist)break;
    }
}


void main() {
    vec2 screenCoords = (gl_FragCoord.xy / vec2(VP_X, VP_Y)) * 2.0 - 1.0;
    vec3 rayOrigin = vec3(0.0);
    vec3 rayDir = getRayDir(screenCoords);
    Hit hit;
    hit.distance = -1.0;
    rayMarch(rayOrigin, rayDir, 100.0, 0.01, hit);
    
    if(hit.distance > 0.0){
        FragColor = vec4(materials[hit.materialId].color.xyz,1.0);
        //FragColor = materials[hit.materialId].color; // Material color visualization

    }
    else{
        FragColor = BackgroundColor;
    }

}   
