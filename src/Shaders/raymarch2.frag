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
float random(vec2 st)
{
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}


Quaternion axisAngleToQuaternion(vec3 axis, float angleDeg) {
    float angleRad = angleDeg * 3.1415926535897932384626433832795 / 180.0; // Convert to radians
    vec3 normalizedAxis = normalize(axis); // Ensure the axis is normalized
    float s = sin(angleRad / 2.0);

    return Quaternion(
        cos(angleRad / 2.0), // w
        normalizedAxis * s // xyz
    );
}

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
    Quaternion qInv = Quaternion(q.w, -q.xyz); 
    float len = sqrt(q.w * q.w + dot(q.xyz, q.xyz));
    q = Quaternion(q.w / len, q.xyz / len);

    Quaternion pRot = quatMultiply(quatMultiply(q, p), qInv);
    return pRot.xyz;
}

vec3 inverseTranslate(vec3 point,vec3 translation){
    return point - translation;
}
vec3 inverseScale(vec3 point,vec3 scale){
    return point / scale;
}
vec3 inverseRotate(vec3 point, vec3 rotationDegrees) {
    // Convert rotation angles from degrees to quaternions for each axis
    Quaternion rotX = axisAngleToQuaternion(vec3(1, 0, 0), rotationDegrees.x);
    Quaternion rotY = axisAngleToQuaternion(vec3(0, 1, 0), rotationDegrees.y);
    Quaternion rotZ = axisAngleToQuaternion(vec3(0, 0, 1), rotationDegrees.z);

    // Combine rotations, order matters (here we use ZYX)
    Quaternion combinedRotation = quatMultiply(quatMultiply(rotZ, rotY), rotX);

    // Rotate the point by the combined rotation quaternion
    return rotatePointByQuaternion(point, combinedRotation);
}

float SphereSDF(vec3 point, vec3 center, vec3 scale, vec3 rotationDegrees, vec3 translation, out int materialId) {
    vec3 localPoint = point;
    // TODO: translate, scale, rotate
    // localPoint = inverseTranslate(localPoint,translation);
    // localPoint = inverseScale(localPoint, scale);
    // localPoint = inverseRotate(localPoint, rotationDegrees);
    float distance = length(localPoint - center) - 1.0;
    return distance;
}
float PlaneSDF(vec3 point, vec3 normal, float height, out int materialId){
    return dot(point,normal) + height;
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
                distance = SphereSDF(point,primatives[i].position.xyz,primatives[i].scale.xyz,primatives[i].rotation.xyz,vec3(0.0),matId);
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


vec3 diffuseBRDF(Hit hit) {
    vec3 diffuseColor = vec3(0.0);
    Material material = materials[hit.materialId];

    diffuseColor = material.diffuse.xyz;


    // Direct lighting
    // for (int i = 0; i < lights.length(); ++i) {
    //     Light light = lights[i];
    //     vec3 lightDir = normalize(light.position - hit.point);
    //     float diff = max(dot(hit.normal, lightDir), 0.0);
    //     diffuseColor += material.color.xyz * light.color.xyz * diff;
    // }

    // Indirect lighting
    for (int depth = 0; depth < MAX_REFLECTION_DEPTH; ++depth) {
        // Randomly sample a new ray direction based on the diffuse BRDF
        vec3 randomDir = normalize(vec3(
            random(gl_FragCoord.xy + vec2(time, 0.0)) * 2.0 - 1.0,
            random(gl_FragCoord.xy + vec2(0.0, time)) * 2.0 - 1.0,
            random(gl_FragCoord.xy + vec2(time, time)) * 2.0 - 1.0
        ));
        vec3 newRayDir = normalize(hit.normal + randomDir);

        // Trace the new ray and accumulate the diffuse color contribution
        Hit newHit;
        rayMarch(hit.point + newRayDir * 0.001, newRayDir, 100.0, 0.01, newHit);

        if (newHit.distance > 0.0) {
            diffuseColor *= materials[newHit.materialId].diffuse.xyz;
            hit = newHit;
        } else {
            diffuseColor *= BackgroundColor.xyz; // Background color contribution
            break; // Exit the loop if the ray doesn't hit any geometry
        }
    }

    return diffuseColor;
}


void main(){
    vec2 screenCoords = (gl_FragCoord.xy / vec2(VP_X, VP_Y)) * 2.0 - 1.0;
    vec3 finalColor = vec3(0.0);
    int numSamples = 8;
    for (int i = 0; i < numSamples; ++i) {
        vec2 jitter = vec2(random(gl_FragCoord.xy + i * vec2(time, time)), random(gl_FragCoord.xy + i * vec2(time, time) + vec2(12.9898, 78.233))) * 2.0 - 1.0;
        jitter /= vec2(VP_X, VP_Y);
        vec3 rayDir = getRayDir(screenCoords + jitter);
        Hit hit;
        hit.distance = -1.0;
        rayMarch(camera.position, rayDir, 100.0, 0.01, hit);
        if (hit.distance > 0.0) {
            finalColor += diffuseBRDF(hit); 
        }
        else {
            finalColor += BackgroundColor.xyz;
        }
    }
    FragColor = vec4(finalColor / float(numSamples), 1.0);
}





// void main() {
//     vec2 screenCoords = (gl_FragCoord.xy / vec2(VP_X, VP_Y)) * 2.0 - 1.0;
//     vec3 rayOrigin = vec3(0.0);
//     vec3 rayDir = getRayDir(screenCoords);
//     Hit hit;
//     hit.distance = -1.0;
//     rayMarch(rayOrigin, rayDir, 100.0, 0.01, hit);
    
//     if(hit.distance > 0.0){
//         FragColor = vec4(materials[hit.materialId].color.xyz,1.0);
//         //FragColor = materials[hit.materialId].color; // Material color visualization
//     }
//     else{
//         FragColor = BackgroundColor;
//     }

// }   