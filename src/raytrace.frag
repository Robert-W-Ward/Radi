// raytrace.frag
#version 460 core
const int MAX_SHAPES = 50;
#define SPHERE 0
#define BOX 1
#define TRIANGLE 2
#define PLANE 3

out vec4 FragColor;
const int MAX_REFLECTION_DEPTH = 3;

struct Material{
    vec4 color;
    float specular;
    float shininess;
    float reflectivity;

};

struct Shape3D{
    int type;
    vec4 position;
    vec4 dimensions;
    vec4 extra;
    Material material;
};

struct Hit{
    vec3 normal;
    Material material;
    vec3 point;
    float distance;
};

struct Light{
    //stub for now
    int type;
    vec3 position;
    vec3 color;
    float intensity;
};

layout(std430, binding = 0) buffer Shape3DBuffer {
    Shape3D shapes[];
};

uniform vec3 camPos;          // Camera position
uniform vec3 camDir;          // Camera direction
uniform vec3 camUp;           // Camera up vector
uniform vec3 camRight;        // Camera right vector
uniform float camFOV;         // Camera field of view
uniform float aspectRatio;    // Aspect ratio of the window
uniform float VP_X;           // Viewport X
uniform float VP_Y;           // Viewport Y
uniform vec3 POINT_LIGHT_POS; // Point lights position in the world

float dot2( in vec3 v ) { return dot(v,v); }

// //Gets the Ray direction throught he fullscreen quad based on the direction the camera is facing
vec3 getRayDir(vec2 screenCoords){
    float scale = tan(radians(camFOV*0.5));
    vec2 screenPos = screenCoords * scale;
    screenPos.x *= aspectRatio;
    return normalize(camRight*screenPos.x + camUp * screenPos.y + camDir);
}

float sphereSDF(vec3 rayPos, vec3 sphereCenter, float sphereRadius) {
    return length(rayPos - sphereCenter) - sphereRadius;
}
float sdBox(vec3 p, vec3 b, vec3 position, vec3 scale) {
    // Apply inverse scale to point p to simulate scaling the box
    p = (p - position) / scale;
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) * min(min(scale.x, scale.y), scale.z);
}
float udTriangle( vec3 p, vec3 a, vec3 b, vec3 c )
{
  vec3 ba = b - a; vec3 pa = p - a;
  vec3 cb = c - b; vec3 pb = p - b;
  vec3 ac = a - c; vec3 pc = p - c;
  vec3 nor = cross( ba, ac );

  return sqrt(
    (sign(dot(cross(ba,nor),pa)) +
     sign(dot(cross(cb,nor),pb)) +
     sign(dot(cross(ac,nor),pc))<2.0)
     ?
     min( min(
     dot2(ba*clamp(dot(ba,pa)/dot2(ba),0.0,1.0)-pa),
     dot2(cb*clamp(dot(cb,pb)/dot2(cb),0.0,1.0)-pb) ),
     dot2(ac*clamp(dot(ac,pc)/dot2(ac),0.0,1.0)-pc) )
     :
     dot(nor,pa)*dot(nor,pa)/dot2(nor) );
}
float sdPlane(vec3 p, vec3 n, float h){
    return dot(p,n) + h;
}

Material defaultMaterial(){
    return Material(vec4(0.75),.5,32.0,0.0);
}
Material backgroundMaterial(){
    return Material(vec4(0.0),1.0,1.0,0.0);
}

vec4 CalculateLighting(vec3 point, Material material, vec3 normal){
    vec3 lightDirection = normalize(POINT_LIGHT_POS - point);

    /// Ambient
    vec4 ambientColor = vec4(0.1,0.1,0.1,1.0);

    // Diffuse
    float diffuse = max(dot(normal, lightDirection),0.0);
    vec4 diffuseColor = diffuse *  material.color ;

    //Specular
    vec3 specularReflectDir = reflect(-lightDirection,normal);
    float specular = pow(max(dot(camDir,specularReflectDir),0.0),material.shininess);
    vec4 specularColor = specular * vec4(1.0,1.0,1.0,1.0) * material.specular;

    return ambientColor + diffuseColor + specularColor;
}
float SceneSDF(vec3 point,out Material hitMaterial){
    float closestDist = 1e9;
    float distance = 1e9;
    for(int i =0; i< shapes.length();++i){
        switch(shapes[i].type){
            case SPHERE:
                distance = sphereSDF(point,shapes[i].position.xyz,shapes[i].dimensions.x);
                break;
            case BOX:
                distance = sdBox(point,shapes[i].dimensions.xyz/2.0,shapes[i].position.xyz,vec3(1.0));
                break;
            case TRIANGLE:
                distance = udTriangle(point,shapes[i].position.xyz,shapes[i].dimensions.xyz,shapes[i].extra.xyz);
                break;
            case PLANE:
                distance = sdPlane(point,normalize(shapes[i].dimensions.xyz),shapes[i].dimensions.y);
                break;
            default:
                break;
        }
        if(distance < closestDist){
            closestDist = distance;
            hitMaterial = shapes[i].material;
        }
    }
    return closestDist;
}
vec3 CalculateNormal(vec3 p, float epsilon) {
    const vec3 dx = vec3(epsilon, 0.0, 0.0);
    const vec3 dy = vec3(0.0, epsilon, 0.0);
    const vec3 dz = vec3(0.0, 0.0, epsilon);
    Material m = defaultMaterial();
    float d = SceneSDF(p,m);
    vec3 n = vec3(
        SceneSDF(p + dx,m) - d,
        SceneSDF(p + dy,m) - d,
        SceneSDF(p + dz,m) - d
    );

    return normalize(n);
}
Hit MarchRay(
    vec3 origin, 
    vec3 direction, 
    int numberOfSteps, 
    float MIN_HIT_DISTANCE,
    float MAX_TRAVEL_DIST)
    {

    vec3 ro = origin;
    vec3 rd = direction;
    float totalDistance = 0.0;
    float nearestDistance = 1e9;
    Material hitMaterial;
    for(float i = 0;i< numberOfSteps; ++i){
        vec3 position = origin + (totalDistance) * direction;

        //Calculate distance from nearest object in the scene
        nearestDistance = SceneSDF(position,hitMaterial);

        //If the nearest object is close enough to be considered "hit" return
        if(nearestDistance < MIN_HIT_DISTANCE){
            vec3 hitPoint = position;
            vec3 normal = CalculateNormal(hitPoint,0.001);
            return Hit(normal,hitMaterial,hitPoint,totalDistance);
        }

        // Misses everything
        if(nearestDistance > MAX_TRAVEL_DIST){
            break;
        }

        totalDistance += nearestDistance;
    }
    return Hit(vec3(0.0,0.0,0.0),backgroundMaterial(),vec3(0.0),MAX_TRAVEL_DIST);
}


void main() {
    //screen setup
    vec2 screenCoords = (gl_FragCoord.xy / vec2(VP_X, VP_Y)) * 2.0 - 1.0;
    Hit h = MarchRay(camPos,getRayDir(screenCoords),100,0.001,100);
    if(h.distance < 100.0){
        vec4 color = CalculateLighting(h.point,h.material,h.normal);
        if(h.material.reflectivity>0.0){
            vec3 reflectDir = reflect(normalize(getRayDir(screenCoords)), h.normal);
            vec3 reflectionOrigin = h.point + h.normal * 0.001;
            Hit reflectedHit = MarchRay(reflectionOrigin, reflectDir, 100, 0.001, 100);

            if(reflectedHit.distance<100.0){
                vec4 reflectedColor = CalculateLighting(reflectedHit.point,reflectedHit.material,reflectedHit.normal);
                color = mix(color,reflectedColor,h.material.reflectivity);
            }
        }

        FragColor = color;
    }else{
        FragColor = vec4(0.0,0.0,0.0,1.0);
    }
}


    // vec4 accumulatedColor = vec4(0.0); // Initialize accumulated color
    // vec4 reflectionAttenuation = vec4(1.0); // Initial reflection contribution is full
    // int depth;

    // for(depth = 0; depth < MAX_REFLECTION_DEPTH; ++depth) {
    //     Material material;
    //     vec3 hitNormal;
    //     float hitDist = rayMarch(rayOrigin, rayDir, 0.0, 100.0, material, hitNormal);
    //     if(hitDist < 100.0) {
    //         // If a hit is found, calculate the point and lighting
    //         vec3 hitPoint = rayOrigin + hitDist * rayDir;
    //         vec4 localColor = calcMaterialLighting(hitPoint, material, hitNormal);
    //         accumulatedColor += reflectionAttenuation * localColor;

    //         // Prepare for next reflection
    //         rayOrigin = hitPoint + hitNormal * 0.001; // Move slightly off the surface to avoid self-intersection
    //         rayDir = reflect(rayDir, hitNormal);
    //         reflectionAttenuation *= vec4(material.reflectivity); // Attenuate the reflection contribution


    //         // Debug: Visualize reflection depth or reflectivity
    //         // accumulatedColor = vec4(depth * 0.25); // Visualize reflection depth
    //         // accumulatedColor = vec4(material.reflectivity); // Visualize reflectivity
    //         if(material.reflectivity <= 0.0) {
    //             break; // No further reflections needed
    //         }
    //     } else {
    //         // If no hit, add background color and break
    //         accumulatedColor += reflectionAttenuation * vec4(0.5, 0.5, 0.5, 1.0); // Background color
    //         break;
    //     }
    // }

    // if (depth == MAX_REFLECTION_DEPTH) {
    //     // Add background color if max depth is reached without a final hit
    //     accumulatedColor += reflectionAttenuation * vec4(0.5, 0.5, 0.5, 1.0); // Background color
    // }

