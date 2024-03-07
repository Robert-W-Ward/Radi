#version 460 core
#define SPHERE 0
#define BOX 1
#define TRIANGLE 2
#define PLANE 3
#define POINT_LIGHT 999
#define RECTANGLE_LIGHT 998
#define DIRECTIONAL 997
#define DISC 996

out vec4 FragColor;

const int MAX_SHAPES = 50;
const int MAX_LIGHTS = 50;
const int MAX_DISTANCE = 100;
const float EPSILON = 0.01;
const int MAX_REFLECTION_DEPTH = 3;
const int RAND_MAX = 100;
const float INFINITY = 1e9;
const vec4 backgroundColor = vec4(0.5,0.5,0.5,1.0);
const float PI = 3.14159;
struct Material{vec4 color;float specular;float shininess; float reflectivity;float ior;float roughness;float albedo;};
struct Shape3D{int type;vec4 position;vec4 dimensions;vec4 extra;Material material;};
struct Light{ int type; vec4 position;vec4 direction;vec4 color;vec4 dimensions;float intensity;};
struct Hit{vec3 normal;Material material;vec3 point;float distance;vec4 accumulatedColor;int depth;};

layout(std430, binding = 0) buffer Shape3DBuffer {
    Shape3D shapes[];
};

layout(std430, binding = 1) buffer LightBuffer{
    Light lights[];
};

uniform vec3 camPos;          // Camera position
uniform vec3 camDir;          // Camera direction
uniform vec3 camUp;           // Camera up vector
uniform vec3 camRight;        // Camera right vector
uniform float camFOV;         // Camera field of view
uniform float aspectRatio;    // Aspect ratio of the window
uniform float focusDistance;
uniform float aperture;
uniform float VP_X;           // Viewport X
uniform float VP_Y;           // Viewport Y
uniform bool isDebug;
uniform int u_samplesPerPixel;
uniform float time;
uniform bool motionBlurActive;

float sphereSDF(vec3 p, vec3 c, float r) {
    return length(p - c) - r;
}

float boxSDF(vec3 p, vec3 b, vec3 B) {
    vec3 q = abs(p - 0.5 * (b + B)) - 0.5 * (B - b);
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float triangleSDF(vec3 p, vec3 v1, vec3 v2, vec3 v3) {
    vec3 e1 = v2 - v1;
    vec3 e2 = v3 - v1;
    vec3 n = cross(e1, e2);
    vec3 q = cross(e2, p - v1);
    vec3 r = cross(n, e1);
    return dot(q, r) / dot(n, n);
}

float rand() {
    float a = fract(sin(gl_FragCoord.x * 12.9898 + gl_FragCoord.y * 78.233) * 43758.5453);
    return a;
}

vec3 getRandomVectorInUnitDisk() {
    vec3 randomVec;
    float r1, r2;
    do {
        r1 = 2.0 * rand() - 1.0;
        r2 = 2.0 * rand() - 1.0;
        randomVec = vec3(r1, r2, 0.0);
    } while (dot(randomVec, randomVec) >= 1.0);

    return randomVec * sqrt(dot(randomVec, randomVec));
}

float sceneSDF(vec3 p, out int shapeIndex) {
    float minDist = 1e9;
    shapeIndex = -1;
    for (int i = 0; i < shapes.length(); ++i) {
        Shape3D shape = shapes[i];
        float dist;
        switch (shape.type) {
            case SPHERE:
                dist = sphereSDF(p, shape.position.xyz, shape.dimensions.x);
                break;
            case BOX:
                vec3 b = shape.position.xyz - shape.dimensions.xyz * 0.5;
                vec3 B = shape.position.xyz + shape.dimensions.xyz * 0.5;
                dist = boxSDF(p, b, B);
                break;
            case TRIANGLE:
                vec3 v1 = shape.position.xyz;
                vec3 v2 = v1 + shape.dimensions.xyz;
                vec3 v3 = v1 + shape.extra.xyz;
                dist = triangleSDF(p, v1, v2, v3);
                break;
        }
        if (dist < minDist) {
            minDist = dist;
            shapeIndex = i;
        }
    }
    return minDist;
}

vec3 getLightDirection(Light light, vec3 objectPosition) {
    vec3 lightDir;
    switch (light.type) {
        case POINT_LIGHT:
            lightDir = light.position.xyz - objectPosition;
            break;
        case RECTANGLE_LIGHT:
            // Calculate the vector from the object to the rectangle center
            vec3 objToRectCenter = light.position.xyz - objectPosition;

            // Calculate the half dimensions of the rectangle
            vec3 halfDimensions = light.dimensions.xyz * 0.5;

            // Project the object-to-rectangle vector onto the rectangle plane
            vec3 projectedVec = objToRectCenter;
            projectedVec -= dot(projectedVec, light.direction.xyz) * light.direction.xyz;

            // Clamp the projected vector to the rectangle boundaries
            vec3 clampedVec = clamp(projectedVec, -halfDimensions, halfDimensions);

            // Calculate the vector from the object to the nearest point on the rectangle
            lightDir = light.position.xyz + clampedVec - objectPosition;
            break;
        case DIRECTIONAL:
            lightDir = -light.direction.xyz;
            break;
        case DISC:
            // Implement disc light direction calculation
            lightDir = vec3(0.0); // Placeholder
            break;
        // Add more cases for other light types
    }
    return normalize(lightDir);
}

vec3 evaluateBRDF(Hit hit, vec3 V, vec3 L) {
    Material mat = hit.material;

    vec3 N = hit.normal;
    N = vec3(0.0, 1.0, 0.0);
    L = vec3(0.0, 1.0, 0.0);
    vec3 diffuse = mat.color.rgb * mat.albedo * max(0.0, dot(N, L));
    return diffuse;
}
vec3 getNormal(vec3 p) {
    const float e = 0.0001;
    const vec3 dx = vec3(e, 0.0, 0.0);
    const vec3 dy = vec3(0.0, e, 0.0);
    const vec3 dz = vec3(0.0, 0.0, e);
    int dummy = -1;
    float d = sceneSDF(p, dummy);
    vec3 n = vec3(
        sceneSDF(p + dx, dummy) - d,
        sceneSDF(p + dy, dummy) - d,
        sceneSDF(p + dz, dummy) - d
    );
    return normalize(n);
}

Hit rayMarch(vec3 ro, vec3 rd) {
    Hit hit;
    hit.distance = MAX_DISTANCE;
    hit.material = Material(vec4(0.0), 0.0, 0.0, 0.0, 0.0, 0.0,0.0);

    float t = 0.0;
    int shapeIndex;
    for (int i = 0; i < 1000; ++i) {
        vec3 p = ro + t * rd;
        float dist = sceneSDF(p, shapeIndex);
        if (dist < EPSILON) {
            hit.point = p;
            hit.normal = getNormal(p);
            hit.material = shapes[shapeIndex].material;
            hit.distance = t;
            hit.depth = 1;
            break;
        }
        t += dist;
        if (t > MAX_DISTANCE) break;
    }

    return hit;
}
vec3 getRayDir(vec2 screenCoords){
    float scale = tan(radians(camFOV*0.5));
    vec2 screenPos = screenCoords * scale;
    screenPos.x *= 1.0/aspectRatio;
    return normalize(camRight*screenPos.x + camUp * screenPos.y + camDir);
}
void main() {
    // Compute pixel coordinates
    vec2 screenCoords = (gl_FragCoord.xy / vec2(VP_X, VP_Y)) * 2.0 - 1.0;
    vec3 color = vec3(0.0);
    const int numSamples = 8;
    // Apply depth of field
    // TODO: Implement depth of field

    for (int i = 0; i < numSamples; ++i) {
        vec2 jitter = vec2(rand(),rand())  * 2.0 - 1.0;
        vec2 jitteredScreenCoords = screenCoords + jitter / vec2(VP_X, VP_Y);
        vec3 rd = getRayDir(jitteredScreenCoords);
        vec3 ro = camPos;
    
        Hit hit = rayMarch(ro, rd);
        if(hit.distance < MAX_DISTANCE){
            vec3 P = hit.point; // Intersection point
            vec3 N = hit.normal; // Surface normal
            vec3 V = -rd; // View direction

            vec3 sampleColor = vec3(0.0);
            for (int j = 0; j < lights.length(); ++j) {
                Light light = lights[j];
                vec3 L = getLightDirection(light,P);
                
                vec3 brdf = evaluateBRDF(hit, V, L);

                sampleColor += brdf * light.color.rgb * light.intensity;
            }

            FragColor = vec4(sampleColor/numSamples, 1.0);
        }else{
            FragColor = backgroundColor;
        }
    }
}