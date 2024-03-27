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
bool useDirectLighting = true;;
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

float random(vec2 st){
    return fract(sin(dot(st.xy, vec2(12.9898,78.233)))* 43758.5453123);
}
vec3 fresnelSchlick(float cosTheta, vec3 F0) {
  return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
}
float fresnelFraction(float cosTheta,float ior){
    float r0 = (1-ior)/(1+ior);
    r0 = r0*r0;
    return r0 + (1-r0)*pow((1-cosTheta),5);
}

float fresnelSchlick90(float cosTheta, float F0, float F90) {
  return F0 + (F90 - F0) * pow(1.0 - cosTheta, 5.0);
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
vec3 importanceSampleGGX(vec2 Xi, vec3 N, float roughness) {
    float a = roughness*roughness;
    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta*cosTheta);
    vec3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;
    vec3 up = abs(N.z) < 0.999 ? vec3(0,0,1) : vec3(1,0,0);
    vec3 tangent = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);
    vec3 sampleVec = tangent * H.x + bitangent * H.y + N * H.z;
    return normalize(sampleVec);
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
    //localPoint = rotatePoint(localPoint, -rotationDegrees); // Inverse rotation to align the point with the box

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
vec3 specularBRDF(vec3 N, vec3 V, vec3 L,vec3 point, int matId, float F0 ) {
    // Phong specular component
    Material mat = materials[matId];
    vec3 specularColor = mat.specular.xyz;
    float shininess = mat.shininess;
    vec3 reflectDir = reflect(-L, N);
    float specAngle = max(dot(reflectDir, V), 0.0);
    float specFactor = pow(specAngle, shininess); 
    return specularColor * specFactor;
}
vec3 diffuseBRDFDirect(vec3 N, vec3 V, vec3 L, vec3 point, int matId, float F0) {
    Material mat = materials[matId];
    vec3 diffuseColor = vec3(0.0);

    // Compute the dot product of the normal and the light direction
    float NoL = max(dot(N, L), 0.0);

    // If there's a positive contribution, calculate the diffuse component
    if (NoL > 0.0) {
        diffuseColor = mat.diffuse.rgb * NoL; // Modulated by the dot product
    }
    
    return diffuseColor;
}
vec3 CookTorrancediffuseBRDF(vec3 albedo,float metallic){
    return (1.0 - metallic) * albedo/PI;
}
vec3 CookTorrancespecularBRDF(vec3 N, vec3 V, vec3 L, float roughness, vec3 F0, vec3 albedo, float metallic) {
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
    vec3 numerator = D * G * F;
    float denominator = 4.0 * NoV * NoL + 0.0001;
    vec3 specular = numerator / denominator;

    if (metallic > 0.0) {
        specular *= albedo;
    }

    return specular;
}


vec3 cookTorranceBRDF(vec3 N, vec3 V, vec3 L, vec3 point, int matId, vec3 F0) {
    Material mat = materials[matId];
    vec3 albedo = mat.color.rgb;
    float roughness = mat.roughness;
    float metallic = mat.metallic;

    vec3 diffuse = CookTorrancediffuseBRDF(albedo, metallic);
    vec3 specular = CookTorrancespecularBRDF(N, V, L, roughness, F0, albedo, metallic);

    // Combine diffuse and specular terms
    vec3 brdf = diffuse + specular;

    return brdf;
}
////////////////////////////////////
///        Path tracing          ///
////////////////////////////////////
void rayIntersect(vec3 rayOrigin, vec3 rayDir, out Hit hit) {
    float tMin = 0.1;
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
    vec3 radiance = vec3(0.2);
    Light light = lights[0];
    for (int depth = 0; depth < MAX_RAY_DEPTH; ++depth) {
        Hit hit;
        rayIntersect(rayOrigin, rayDir, hit);

        if (hit.distance > 0.0) {
            Material material = materials[hit.materialId];
            vec3 accumulatedLight = vec3(0.0);
            vec3 V = normalize(-rayDir);
            vec3 N = hit.normal;
            vec3 randomDir = normalize(hit.normal + randomHemisphereDirection(hit.normal));

            
            // Russian Roulette termination
            if (depth > 3) {
                float p = (throughput.x + throughput.y + throughput.z)/3.0;
                if (random(gl_FragCoord.xy + depth) > p) {
                    break;                
                }
                throughput /= p;
            }   
            float F0;
            if (material.type == METALLIC) {
                F0 = (material.color.x + material.color.y + material.color.z) / 3.0;
            } else if (material.type == DIELECTRIC) {
                F0 = pow((material.ior - 1.0) / (material.ior + 1.0), 2.0);
            } else {
                F0 = 0.04; // Default F0 for other materials
            }


            if (material.type == LAMBERTIAN) {
                // Sample indirect lighting for Lambertian materials
                vec3 indirectLight = vec3(0.0);
                Hit indirectHit;
                vec3 L;
                float pdf = 1.0 / (2.0 * PI);
                
                for (int i = 0; i < 4; ++i) {
                    L = randomHemisphereDirection(N);
                    rayIntersect(hit.point, L, indirectHit);
                    
                    if (indirectHit.distance > 0.0) {
                        Material indirectMaterial = materials[indirectHit.materialId];
                        vec3 indirectBRDF = cookTorranceBRDF(indirectHit.normal, -L, -L, indirectHit.point, indirectMaterial.id, vec3(F0));
                        indirectLight += indirectBRDF * throughput * max(dot(N, L), 0.0);
                    }
                }
                
                indirectLight /= (float(4) * pdf);
                
                vec3 brdf = cookTorranceBRDF(N, V, V, hit.point, material.id, vec3(F0));
                radiance += throughput * brdf * indirectLight;
                throughput *= brdf;
                
                rayOrigin = hit.point + hit.normal * 0.001;
                rayDir = randomHemisphereDirection(hit.normal);
            } else if (material.type == METALLIC) {
                // Handle reflections for metallic materials
                vec3 reflectedDir = reflect(rayDir, N);
                rayOrigin = hit.point + hit.normal * 0.001;
                rayDir = reflectedDir;
            } else if (material.type == DIELECTRIC) {
                // Handle reflections and refractions for dielectric materials
                float ior = material.ior;
                bool inside = dot(rayDir, N) > 0.0;
                float refraction_ratio = inside ? 1.0/ior : ior;

                float cosTheta = min(dot(-normalize(rayDir), normalize(N)), 1.0);
                float sinTheta = sqrt(1.0 - cosTheta * cosTheta);
                
                bool cannot_refract = (refraction_ratio * sinTheta) >1.0;

                float reflectance = fresnelFraction(cosTheta,refraction_ratio);

                if (cannot_refract || reflectance > random(gl_FragCoord.xy)) {
                    // Total internal reflection
                    vec3 reflectedDir = reflect(rayDir, N);
                    rayOrigin = hit.point + hit.normal * 0.01;
                    rayDir = reflectedDir;
                } else {
                    // Refraction
                    vec3 refractedDir = refract(normalize(rayDir), normalize(inside?-N:N), refraction_ratio);
                    rayOrigin = hit.point - hit.normal * 0.001;
                    rayDir = refractedDir;
                    throughput *= 1.0 - reflectance;
                }
            }
        } else {
            radiance += throughput * BackgroundColor.xyz; break;
        }
    }   
    return radiance;
}
void main(){

    vec2 screenCoords = (gl_FragCoord.xy / vec2(VP_X, VP_Y)) * 2.0 - 1.0;
    vec3 finalColor = vec3(0.0);
    int numSamples = 64;
    for (int i = 0; i < numSamples; ++i) {
        vec2 jitter = vec2(random(gl_FragCoord.xy + i * vec2(time, time)), random(gl_FragCoord.xy + i * vec2(time, time) + vec2(12.9898, 78.233))) * 2.0 - 1.0;
        jitter /= vec2(VP_X, VP_Y);
        vec3 rayDir = getRayDir(screenCoords + jitter);
        vec3 color = pathTrace(camera.position, rayDir);
        finalColor += color;
    }
    FragColor = vec4(finalColor / float(numSamples), 1.0);
}