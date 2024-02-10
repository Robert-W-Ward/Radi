// raytrace.frag
#version 460 core
const int MAX_SHAPES = 50;
#define SPHERE 0
#define BOX 1
#define PYRAMID 2


out vec4 FragColor;

struct Material{
    vec4 color;
    float specular;
    float shininess;
};

struct Shape{
    int type;
    vec4 position;
    vec4 dimensions;
    Material material;
};


layout(std430, binding = 0) buffer ShapeBuffer {
    Shape shapes[];
};



uniform vec3 camPos;          // Camera position
uniform vec3 camDir;          // Camera direction
uniform vec3 camUp;           // Camera up vector
uniform vec3 camRight;        // Camera right vector
uniform float camFOV;         // Camera field of view
uniform float aspectRatio;    // Aspect ratio of the window
uniform float VP_X;
uniform float VP_Y;
vec3 lightPos = vec3(2.0,5.0,0.0);




float sphereSDF(vec4 rayPos, vec4 sphereCenter, float sphereRadius) {
    return length(rayPos - sphereCenter) - sphereRadius;
}
float boxSDF(vec3 pos, vec3 b){
    vec3 q = abs(pos) - b;
    return length(max(q,0.0))+ min(max(q.x,max(q.y,q.z)),0.0);
}

Material defaultMaterial(){
    return Material(vec4(0.75),.5,32.0);
}


float getSceneSDF(vec3 point, out Material material) {
    float closestDist = 1e9; // Use a very high value to start with
    material = defaultMaterial(); // Default material in case no hit

    for (int i = 0; i < shapes.length(); ++i) {
        float dist = 1e9; // Initialize with a high value
        if (shapes[i].type == 0) {
            dist = sphereSDF(vec4(point,0.0),shapes[i].position,5.0);
        } else if (shapes[i].type == BOX) {
            //dist = boxSDF(shapes[i].position,shapes[i].dimensions);
        }
        // Add more shape types here as needed

        if (dist < closestDist) {
            closestDist = dist;
            material = shapes[i].material;
        }
    }

    return closestDist;
}


float getDist(vec3 point){
    float SphereDist = sphereSDF(vec4(point,0.0), vec4(0.0), 1.0); 
    return SphereDist;
}

vec3 getNormal(vec3 p) {
    const float eps = 0.01; // Small offset for calculating gradient
    vec2 e = vec2(eps, 0.0);

    // Create small offsets around the point p
    Material dummyMaterial; // Dummy material, we don't need material info for normals

    float d = getSceneSDF(p, dummyMaterial);
    vec3 n = vec3(
        d - getSceneSDF(p - e.xyy, dummyMaterial),
        d - getSceneSDF(p - e.yxy, dummyMaterial),
        d - getSceneSDF(p - e.yyx, dummyMaterial)
    );

    return normalize(n); // Normalize the gradient to get the normal
}


vec4 calcMaterialLighting(vec3 point, Material mat){
    vec3 lightDir = normalize(vec3(1.0,1.0,1.0));
    vec3 normal = getNormal(point);
    float diff = max(dot(normal,lightDir),0.0);

    //Specular
    vec3 viewDir = normalize(camPos - point);
    vec3 reflectDir = reflect(-lightDir,normal);
    float spec = pow(max(dot(viewDir,reflectDir),0.0),mat.shininess) * mat.specular;

    vec4 diffuseColor = mat.color * diff;
    vec4 specularColor = vec4(1.0) * spec; 
    return diffuseColor + specularColor;

}

//Gets the Ray direction throught he fullscreen quad based on the direction the camera is facing
vec3 getRayDir(vec2 screenCoords){
    float scale = tan(radians(camFOV*0.5));
    vec2 screenPos = screenCoords * scale;
    screenPos.x *= aspectRatio;
    return normalize(camRight*screenPos.x + camUp * screenPos.y + camDir);
}

// Ray marching function
float rayMarch(vec3 rayOrigin, vec3 rayDir, float start, float end, out Material material) {
    float depth = start;
    for (float i = 0.0; i < 100.0; i++) {
        vec3 pos = rayOrigin + depth * rayDir;
        float distance = getSceneSDF(pos, material); 

        if (distance < 0.001) { // Intersection threshold
            return depth; // Hit color
        }
        depth += distance;
        if (depth >= end) {
            return end;
        }
    }
    return end; // Miss color
}

void main() {

    //Normalize UV
    vec2 screenCoords = (gl_FragCoord.xy / vec2(VP_X,VP_Y)) * 2.0 - 1.0;
    Material material;

    
    //Get ray dir from the camera orientation
    vec3 rayDir = getRayDir(screenCoords);
    vec3 rayOrigin = camPos;

    //Perform ray marching
    float minDist = 0.0;
    float maxDist = 100.0;
    float hitDist = rayMarch(rayOrigin,rayDir,minDist,maxDist,material);

    if(hitDist < maxDist){
        vec3 hitPoint = rayOrigin + hitDist * rayDir;
        vec4 color = calcMaterialLighting(hitPoint,material);
        FragColor = color;
    }else{
        FragColor = vec4(0.5,0.5,0.5,1.0);
    }
}
