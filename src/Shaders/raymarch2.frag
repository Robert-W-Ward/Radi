// raytrace.frag
#version 460 core
const int MAX_SHAPES = 50;
#define SPHERE 0
#define BOX 1
#define PLANE 3
#define POINT_LIGHT 999
out vec4 FragColor;


uniform int VP_X;  
uniform int VP_Y;
uniform bool isDebug;
uniform float time;

const int LAMBERTIAN = 0;
const int METALLIC = 1;
const int DIELECTRIC = 2;
const int MAX_RAY_DEPTH = 10;
const vec4 BackgroundColor = vec4(0.5,0.5,0.5,1.0);

float SceneSDF(vec3 point,out int materialId);
///////////////////////////////
///         Structs         ///
///////////////////////////////
struct Material{
    int id;
    int type;
    vec4 ambient;
    vec4 diffuse;
    vec4 specular;
    vec4 color;
    float shininess;
    float albedo;
    float reflectivity;
    float metallic;
    float roughness;
    float ior;
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
///////////////////////////////
///      SSBOs              ///
///////////////////////////////
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
//////////////////////////////////
///      Utility Function      ///
//////////////////////////////////
float random(vec2 st){
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
    return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}
vec3 randomHemisphereDirection(vec3 normal) {
    float u1 = random(gl_FragCoord.xy);
    float u2 = random(gl_FragCoord.xy + vec2(0.0, 1.0));
    
    float theta = acos(sqrt(1.0 - u1));
    float phi = 2.0 * 3.14159 * u2;
    
    float x = sin(theta) * cos(phi);
    float y = sin(theta) * sin(phi);
    float z = cos(theta);
    
    vec3 tangent = normalize(cross(normal, vec3(0.0, 1.0, 0.0)));
    vec3 bitangent = cross(normal, tangent);
    
    return normalize(tangent * x + bitangent * y + normal * z);
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
float calculateShadow(vec3 hitPoint, vec3 lightPosition, float maxShadowDist, float minDist, float shadowSharpness) {
    return 1.0;
    vec3 shadowRayDir = normalize(lightPosition - hitPoint);
    float lightDistance = length(lightPosition - hitPoint);
    float distanceTraveled = minDist; // Start at a small offset to avoid self-shadowing
    float shadowFactor = 1.0;

    while (distanceTraveled < lightDistance && distanceTraveled < maxShadowDist) {
        vec3 curPos = hitPoint + shadowRayDir * distanceTraveled;
        int mat;
        float nearestDist = SceneSDF(curPos, mat);

        if (nearestDist < minDist+.01) {
            return 0.0; // Early exit if in shadow
        }

        // Accumulate shadow factor based on the distance traveled and shadow sharpness
        shadowFactor = min(shadowFactor, shadowSharpness * nearestDist / distanceTraveled);

        distanceTraveled += nearestDist;
    }

    return shadowFactor;
}
////////////////////////////////////
///        Shape SDFs            ///
////////////////////////////////////
float SphereSDF(vec3 point, vec3 center, vec3 scale, vec3 rotationDegrees, vec3 translation) {
    vec3 localPoint = point;
    float distance = length(localPoint - center) - 1.0;
    return distance;
}
float BoxSDF(vec3 point, vec3 position, vec3 scale) {
    vec3 localPoint = point - position;
    vec3 absLocalPoint = abs(localPoint);
    vec3 d = absLocalPoint - scale;
    return min(max(d.x, max(d.y, d.z)), 0.0) + length(max(d, 0.0));
}
float PlaneSDF(vec3 point, vec3 planePosition, vec3 planeNormal) {
    return dot(planeNormal, (point - planePosition));
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
                distance = SphereSDF(point,primatives[i].position.xyz,primatives[i].scale.xyz,primatives[i].rotation.xyz,vec3(0.0));
                break;
            case BOX:
                matId = primatives[i].materialId;
                //normal should be in the positive y direction
                distance = BoxSDF(point,primatives[i].position.xyz,primatives[i].scale.xyz);
                break;
            default:
                break;
        }
        if(distance < minDistance){
            minDistance = distance;
            materialId = matId;
        }
    }
    return minDistance;
}
////////////////////////////////////
///        Raymarching           ///
////////////////////////////////////

void rayMarch(vec3 rayOrigin, vec3 rayDir,float maxDist, float minDist,out Hit hit) {
    float distanceTraveled = 0.0;
    for(int i = 0; i < 1000; ++i){
        int materialId;
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
void rayIntersect(vec3 rayOrigin, vec3 rayDir, out Hit hit) {
    float tMin = 0.01;
    float tMax = 1000.0;
    
    while (tMin < tMax) {
        vec3 point = rayOrigin + rayDir * tMin;
        int materialId = 0;
        float distance = SceneSDF(point, materialId);
        
        if (distance < 0.001) {
            hit.distance = distance;
            hit.point = point;
            hit.normal = CalculateNormal(point, 0.001);
            hit.materialId = materialId;
            return;
        }
        
        tMin += distance;
    }
    
    hit.distance = -1.0; 
}

////////////////////////////////////
///           BRDFs              ///
////////////////////////////////////
vec3 dielectricBRDF(Hit hit, vec3 viewDir, vec3 rayDir) {
    Material material = materials[hit.materialId];
    vec3 refractDir = refract(rayDir, hit.normal, 1.0 / material.ior);
    vec3 reflectDir = reflect(rayDir, hit.normal);
    float fresnel = fresnelSchlick(max(dot(rayDir, hit.normal), 0.0), vec3(0.04)).r;

    vec3 dielectricColor = vec3(0.0);

    if (refractDir != vec3(0.0)) {
        Hit refractHit;
        rayMarch(hit.point + refractDir * 0.001, refractDir, 100.0, 0.01, refractHit);
        if (refractHit.distance > 0.0) {
            dielectricColor += materials[refractHit.materialId].diffuse.xyz * (1.0 - fresnel);
        } else {
            dielectricColor += BackgroundColor.xyz * (1.0 - fresnel);
        }
    }

    Hit reflectHit;
    rayMarch(hit.point + reflectDir * 0.001, reflectDir, 100.0, 0.01, reflectHit);
    if (reflectHit.distance > 0.0) {
        dielectricColor += materials[reflectHit.materialId].diffuse.xyz * fresnel;
    } else {
        dielectricColor += BackgroundColor.xyz * fresnel;
    }

    return dielectricColor;
}
vec3 specularBRDF(Hit hit, vec3 viewDir) {
    Material material = materials[hit.materialId];
    vec3 specularColor = materials[hit.materialId].specular.xyz;
    vec3 lightDir = normalize(lights[0].position - hit.point); // Assuming a single light source for simplicity
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float NdotH = max(dot(hit.normal, halfwayDir), 0.0);
    vec3 F0 = mix(vec3(0.04), material.diffuse.xyz, material.metallic); 
    vec3 fresnel = fresnelSchlick(NdotH, F0);
    float roughness = material.roughness * material.roughness; // Remapping roughness to [0, 1] range
    float ggx2 = NdotH * NdotH * (roughness * roughness - 1.0) + 1.0;
    ggx2 = max(ggx2, 0.0001); // Prevent division by zero
    float denominator = 4.0 * NdotH * NdotH + roughness * roughness;
    float geometry = material.roughness / denominator;
    float NdotV = max(dot(hit.normal, viewDir), 0.0);
    specularColor = fresnel * geometry / ggx2 * material.diffuse.xyz * lights[0].color.xyz * lights[0].intensity * max(dot(hit.normal, lightDir), 0.0) / NdotV;
    return specularColor;
}
vec3 diffuseBRDFNoDirectLighting(Hit hit,vec3 incomingRayDir,vec3 outgoingRayDir) {
    vec3 diffuseColor = vec3(0.0);
    Material material = materials[hit.materialId];
    diffuseColor = material.diffuse.xyz;
    return diffuseColor;
}
vec3 diffuseBRDFWithDirectLighting(Hit hit,vec3 incomingRayDir,vec3 outgoingRayDir) {
    vec3 diffuseColor = vec3(0.0);
    Material material = materials[hit.materialId];
    diffuseColor = material.diffuse.xyz;

    for (int i = 0; i < lights.length(); ++i) {
        vec3 lightDir = normalize(lights[i].position - hit.point);
        float NdotL = max(dot(hit.normal, lightDir), 0.0);

        float shadowFactor = calculateShadow(hit.point, lights[i].position, 100.0, 0.01, 0.5);

        diffuseColor+= material.diffuse.xyz * lights[i].color.xyz * lights[i].intensity * NdotL;
    }
    return diffuseColor;
}

////////////////////////////////////
///        Path tracing          ///
////////////////////////////////////
vec3 pathTrace(vec3 rayOrigin, vec3 rayDir) {
    vec3 throughput = vec3(1.0);
    vec3 radiance = vec3(0.0);
    
    for (int depth = 0; depth < MAX_RAY_DEPTH; ++depth) {
        Hit hit;
        rayIntersect(rayOrigin, rayDir, hit);
        
        if (hit.distance > 0.0) {
            Material material = materials[hit.materialId];
            
            // Russian Roulette termination
            if (depth > 3) {
                float p = max(material.diffuse.x, max(material.diffuse.y, material.diffuse.z));
                if (random(gl_FragCoord.xy + depth) > p) {
                    break;                
                }
                throughput /= p;
            }
            
            // Diffuse BRDF sampling
            vec3 randomDir = normalize(hit.normal + randomHemisphereDirection(hit.normal));
            vec3 brdf = diffuseBRDFWithDirectLighting(hit, rayDir, randomDir);
            
            throughput *= brdf;
            
            rayOrigin = hit.point + randomDir * 0.001;
            rayDir = randomDir;
        } else {
            radiance += throughput * BackgroundColor.xyz; break;
        }
    }
    
    return radiance;
}


void main(){
    vec2 screenCoords = (gl_FragCoord.xy / vec2(VP_X, VP_Y)) * 2.0 - 1.0;
    vec3 finalColor = vec3(0.0);
    int numSamples = 32;

    bool useDirectLighting = true; //screenCoords.x < 0.0;

    for (int i = 0; i < numSamples; ++i) {
        vec2 jitter = vec2(random(gl_FragCoord.xy + i * vec2(time, time)), random(gl_FragCoord.xy + i * vec2(time, time) + vec2(12.9898, 78.233))) * 2.0 - 1.0;
        jitter /= vec2(VP_X, VP_Y);
        vec3 rayDir = getRayDir(screenCoords + jitter);

        vec3 color = pathTrace(camera.position, rayDir);
        finalColor += color;
    }
    FragColor = vec4(finalColor / float(numSamples), 1.0);
}