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
const float RECIPROCAL_PI = 0.3183098861837907;
const float RECIPROCAL_2PI = 0.15915494309189535;
const float PI = 3.14159;
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
    vec4 position;
    vec4 scale;
    vec4 rotation;
    float intensity;
};

///////////////////////////////
///   Function Declarations ///
///////////////////////////////
float SceneSDF(vec3 point,out int materialId);
void rayIntersect(vec3 rayOrigin, vec3 rayDir, out Hit hit);
///////////////////////////////
///           SSBOs         ///
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
///      Utility Functions     ///
//////////////////////////////////
// Utility function to convert degrees to radians
float degreesToRadians(float degrees) {
    return degrees * (3.141592653589793 / 180.0);
}
vec3 rotateX(vec3 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z);
}
// Utility function to rotate a point around the Y axis
vec3 rotateY(vec3 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z);
}
// Utility function to rotate a point around the Z axis
vec3 rotateZ(vec3 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z);
}
// Function to rotate a point around an arbitrary axis
vec3 rotatePoint(vec3 p, vec3 rotationDegrees) {
    // Convert rotation from degrees to radians
    vec3 rotationRadians = vec3(degreesToRadians(rotationDegrees.x), degreesToRadians(rotationDegrees.y), degreesToRadians(rotationDegrees.z));
    
    // Apply rotations in radians
    p = rotateX(p, rotationRadians.x);
    p = rotateY(p, rotationRadians.y);
    p = rotateZ(p, rotationRadians.z);
    return p;
}
float random(vec2 st){
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}
float fresnelSchlick90(float cosTheta, float F0, float F90) {
  return F0 + (F90 - F0) * pow(1.0 - cosTheta, 5.0);
} 
vec3 lambertianDiffuse(vec3 albedo){
    return albedo/ PI;
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
float ggxNDF(float NoH, float roughness) {
    // GGX normal distribution function - Trowbridge-Reitz
    float alpha = roughness * roughness;
    float alpha2 = alpha * alpha;
    float denom = ((NoH * NoH) * (alpha2 -1.0) + 1.0);
    return alpha2 / (PI * (denom * denom));
}
float geometrySchlickGGX(float NoV, float roughness){
    float r = (roughness + 1.0);
    float k = (r*r)/8.0;
    float denom = NoV * (1.0-k)+k;
    return NoV/denom;
}
float geometrySmith(vec3 N, vec3 V, vec3 L, float roughness){
    float NoV = max(dot(N, V), 0.0);
    float NoL = max(dot(N, L), 0.0);
    return geometrySchlickGGX(NoV, roughness) * geometrySchlickGGX(NoL, roughness);
}
bool inShadow(vec3 point, vec3 lightPosition) {
    vec3 shadowRayDirection = normalize(lightPosition - point);
    float distanceToLight = length(lightPosition - point);
    Hit shadowHit;
    
    rayIntersect(point + shadowRayDirection * 0.001, shadowRayDirection, shadowHit);
    return shadowHit.distance > 0.0 && shadowHit.distance < distanceToLight;
}
vec3 reflectRay(vec3 incident, vec3 normal) {
    return incident - 2.0 * dot(incident, normal) * normal;
}
vec3 refractRay(vec3 I, vec3 N, float ior) {
    float cosI = clamp(-1.0, 1.0, dot(I, N));
    float etaI = 1.0, etaT = ior;
    vec3 n = N;
    if (cosI < 0.0) { cosI = -cosI; } else 
    { 
        float temp = etaI;
        etaI = etaT;
        etaT = temp;
        n = -N;
    }
    float eta = etaI / etaT;
    float k = 1.0 - eta * eta * (1.0 - cosI * cosI);
    if (k < 0.0) {
        return vec3(0.0);
    }else{
        return eta * I + (eta * cosI - sqrt(k)) * n;
    }
}

////////////////////////////////////
///            SDFs              ///
////////////////////////////////////
float SphereSDF(vec3 point, vec3 center, vec3 scale, vec3 rotationDegrees, vec3 translation) {
    vec3 localPoint = point;
    float distance = length(localPoint - center) - 1.0;
    return distance;
}
float BoxSDF(vec3 point, vec3 position, vec3 scale, vec3 rotationDegrees) {
    // Transform the point into the box's local coordinate space
    vec3 localPoint = point - position;
    localPoint = rotatePoint(localPoint, -rotationDegrees); // Inverse rotation to align the point with the box

    // Apply scale
    vec3 absLocalPoint = abs(localPoint) / scale;
    vec3 d = absLocalPoint - vec3(1.0);

    // Signed distance
    float insideDistance = min(max(d.x, max(d.y, d.z)), 0.0);
    float outsideDistance = length(max(d, 0.0));
    return insideDistance + outsideDistance;
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
                distance = BoxSDF(point,primatives[i].position.xyz,primatives[i].scale.xyz,primatives[i].rotation.xyz);
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
///           BRDFs              ///
////////////////////////////////////
vec3 specularBRDF(vec3 lightDir, vec3 viewDir, vec3 normal, vec3 specularColor, float shininess) {
    // Phong specular component
    vec3 reflectDir = reflect(-lightDir, normal);
    float specAngle = max(dot(reflectDir, viewDir), 0.0);
    float specFactor = pow(specAngle, shininess); 
    return specularColor * specFactor; 
}
vec3 diffuseBRDFNoDirectLighting(Hit hit,vec3 incomingRayDir,vec3 outgoingRayDir) {
    vec3 diffuseColor = vec3(0.0);
    Material material = materials[hit.materialId];
    diffuseColor = material.diffuse.xyz;
    return diffuseColor;
}
vec3 diffuseBRDFWithDirectLighting(Hit hit,vec3 incomingRayDir,vec3 outgoingRayDir) {
    Material material = materials[hit.materialId];
    vec3 diffuseColor = vec3(0.0);
    float NoL;
    for (int i = 0; i < lights.length(); ++i) {
        vec3 lightDir = normalize(lights[i].position.xyz - hit.point);
        NoL = max(dot(hit.normal, lightDir), 0.0);

        if(!inShadow(hit.point, lights[i].position.xyz)){
            diffuseColor += material.diffuse.xyz * lights[i].color.xyz * lights[i].intensity * NoL;        
        }
    }
    return diffuseColor * material.diffuse.a / PI ;
}
vec3 cookTorranceBRDF(vec3 N, vec3 V, vec3 L, vec3 albedo,float roughness,float metallic,vec3 F0){
    vec3 H = normalize(V + L);
    float NoL = max(dot(N, L), 0.0);
    float NoV = max(dot(N, V), 0.0);
    float NoH = max(dot(N, H), 0.0);
    float HoV = max(dot(H, V), 0.0);

    // Fresnel
    vec3 F = fresnelSchlick(HoV, F0);

    // Normal Distribution Function
    float D = ggxNDF(roughness, NoH);

    // Geometry Function
    float G = geometrySmith(N, V, L, roughness);


    // Specular term
    vec3 numerator  = D * G * F;
    float denominator = 4.0 * NoV * NoL + 0.0001;
    vec3 specular = numerator / denominator;

    // Lambertian diffuse term for non-metals
    vec3 diffuse = (1.0 -F) * albedo / PI;

    // Combine and factor in metallicness
    vec3 brdf = ((1.0 - metallic) * diffuse * specular) * NoL;
    return brdf;
}

vec3 modifiedPhongBRDF(vec3 lightDir, vec3 viewDir, vec3 normal, 
                vec3 phongDiffuseCol, vec3 phongSpecularCol, float phongShininess) {
  vec3 color = phongDiffuseCol * RECIPROCAL_PI;
  vec3 reflectDir = reflect(-lightDir, normal);
  float specDot = max(dot(reflectDir, viewDir), 0.001);
  float normalization = (phongShininess + 2.0) * RECIPROCAL_2PI; 
  color += pow(specDot, phongShininess) * normalization * phongSpecularCol;
  return color;
}
////////////////////////////////////
///        Path tracing          ///
////////////////////////////////////
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
vec3 pathTrace(vec3 rayOrigin, vec3 rayDir) {
    vec3 throughput = vec3(1.0);
    vec3 radiance = vec3(0.0);
    Light light = lights[0];
    for (int depth = 0; depth < MAX_RAY_DEPTH; ++depth) {
        Hit hit;
        rayIntersect(rayOrigin, rayDir, hit);

        if (hit.distance > 0.0) {
            Material material = materials[hit.materialId];
            vec3 randomDir = normalize(hit.normal + randomHemisphereDirection(hit.normal));

            // Russian Roulette termination
            if (depth > 3) {
                float p = (throughput.x + throughput.y + throughput.z)/3.0;
                if (random(gl_FragCoord.xy + depth) > p) {
                    break;                
                }
                throughput /= p;
            }
            vec3 L = normalize(light.position.xyz - hit.point);
            vec3 V = -rayDir;
            vec3 N = hit.normal;
            vec3 F0 = vec3((material.ior - 1.0) / (material.ior +1.0)); // default for non-conductors

            if(!inShadow(hit.point,light.position.xyz)){
                vec3 brdf;
                if(material.type == LAMBERTIAN){
                    brdf = diffuseBRDFWithDirectLighting(hit,V,L);
                }else if( material.type == METALLIC){
                    vec3 F0 = material.color.xyz;
                    brdf = cookTorranceBRDF(N,V,L,material.diffuse.xyz,material.roughness,material.metallic,F0) * material.diffuse.a; // albedo in PBR = diffuse or base color
                }
                //radiance += throughput * ((light.color.rgb * light.intensity)* brdf);
                radiance += throughput * (light.color.rgb * light.intensity) * brdf;
            }
            rayOrigin = hit.point;
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
    int numSamples = 16;

    for (int i = 0; i < numSamples; ++i) {
        vec2 jitter = vec2(random(gl_FragCoord.xy + i * vec2(time, time)), random(gl_FragCoord.xy + i * vec2(time, time) + vec2(12.9898, 78.233))) * 2.0 - 1.0;
        jitter /= vec2(VP_X, VP_Y);
        vec3 rayDir = getRayDir(screenCoords + jitter);
        vec3 color = pathTrace(camera.position, rayDir);
        finalColor += color;
    }
    FragColor = vec4(finalColor / float(numSamples), 1.0);
}