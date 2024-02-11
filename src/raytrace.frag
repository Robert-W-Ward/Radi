// raytrace.frag
#version 460 core
const int MAX_SHAPES = 50;
#define SPHERE 0
#define BOX 1
#define TRIANGLE 2




out vec4 FragColor;
const int MAX_REFLECTION_DEPTH =3;
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
    Material material;
    vec4 extra;
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
uniform float VP_X;
uniform float VP_Y;
uniform vec3 POINT_LIGHT_POS;


float dot2( in vec3 v ) { return dot(v,v); }
vec4 sphereSDF(vec3 rayPos, vec3 sphereCenter, float sphereRadius) {
    float dist = length(rayPos - sphereCenter) - sphereRadius;
    vec3 normal = normalize(rayPos-sphereCenter);
    return vec4(dist,normal);
}
vec4 boxSDF(vec3 collisonPoint, vec3 b,vec3 boxPos){
    vec3 q = abs(collisonPoint - boxPos) - b;
    float dist =length(max(q,0.0))+ min(max(q.x,max(q.y,q.z)),0.0);
    vec3 normal = normalize(sign(collisonPoint - boxPos) * step(b, abs(collisonPoint - boxPos)));
    return vec4(dist,normal);
}
vec4 udTriangle( vec3 p, vec3 a, vec3 b, vec3 c )
{
    vec3 ba = b - a; vec3 pa = p - a;
    vec3 cb = c - b; vec3 pb = p - b;
    vec3 ac = a - c; vec3 pc = p - c;
    vec3 nor = cross( ba, ac );

    float distance = sqrt(
        (sign(dot(cross(ba,nor),pa)) +
         sign(dot(cross(cb,nor),pb)) +
         sign(dot(cross(ac,nor),pc)) < 2.0)
         ?
         min( min(
         dot2(ba*clamp(dot(ba,pa)/dot(ba,ba),0.0,1.0)-pa),
         dot2(cb*clamp(dot(cb,pb)/dot(cb,cb),0.0,1.0)-pb) ),
         dot2(ac*clamp(dot(ac,pc)/dot(ac,ac),0.0,1.0)-pc) )
         :
         dot(nor,pa) * dot(nor,pa) / dot(nor, nor) );

    vec3 normalizedNor = normalize(nor);

    return vec4(distance, normalizedNor.x, normalizedNor.y, normalizedNor.z);
}


Material defaultMaterial(){
    return Material(vec4(0.75),.5,32.0,0.0);
}


vec4 getSceneSDF(vec3 point, out Material material) {
    float closestDist = 1e9; // Use a very high value to start with
    material = defaultMaterial(); // Default material in case no hit
    vec3 closestNormal = vec3(0.0);
    for (int i = 0; i < shapes.length(); ++i) {
        float dist = 1e9; // Initialize with a high value
        vec3 normal = vec3(0.0);
        vec4 result;
        if (shapes[i].type == 0) {
            result = sphereSDF(point,shapes[i].position.xyz,shapes[i].dimensions.x);
            dist = result.x;
        } else if (shapes[i].type == BOX) {
            result = boxSDF(point,shapes[i].dimensions.xyz,shapes[i].position.xyz);
            dist = result.x;
        }
        else if(shapes[i].type == TRIANGLE){
            result = udTriangle(point,shapes[i].position.xyz,shapes[i].dimensions.xyz,shapes[i].extra.xyz);
            dist=  result.x;
        }
        dist = result.x;
        normal = result.yzw;

        // Add more shape types here as needed

        if (dist < closestDist) {
            closestDist = dist;
            closestNormal = normal;
            material = shapes[i].material;
        }
    }

    return vec4(closestDist,closestNormal);
}


vec4 calcMaterialLighting(vec3 point, Material mat,vec3 normal){
    vec3 lightDir = normalize(POINT_LIGHT_POS - point);
    float diff = max(dot(normal,lightDir),0.0);

    //Ambient Lighting
    vec3 ambientLightColor = vec3(0.2, 0.2, 0.2); // Example: low intensity gray light
    vec4 ambientColor = mat.color * vec4(ambientLightColor, 1.0);

    //Specular Lighting highlights
    vec3 viewDir = normalize(camPos - point);
    vec3 reflectDirSpecular = reflect(-lightDir,normal);
    float spec = pow(max(dot(viewDir,reflectDirSpecular),0.0),mat.shininess) * mat.specular;

    //Diffuse Lighting
    vec4 diffuseColor = mat.color * diff;
    vec4 specularColor = vec4(1.0) * spec; 

    return ambientColor + diffuseColor + specularColor;

}

//Gets the Ray direction throught he fullscreen quad based on the direction the camera is facing
vec3 getRayDir(vec2 screenCoords){
    float scale = tan(radians(camFOV*0.5));
    vec2 screenPos = screenCoords * scale;
    screenPos.x *= aspectRatio;
    return normalize(camRight*screenPos.x + camUp * screenPos.y + camDir);
}

// Ray marching function
float rayMarch(vec3 rayOrigin, vec3 rayDir, float start, float end, out Material material,out vec3 hitNormal) {
    float closestDist = 1e9;
    vec3 normal;
    for (float i = 0.0; i < 100.0; i++) {
        vec3 pos = rayOrigin + start * rayDir;
        vec4 result = getSceneSDF(pos,material);
        float distance = result.x; 
        normal = result.yzw;

        if (distance < 0.001) { // Intersection threshold
            hitNormal = normal;
            return start; // Hit color
        }
        start += distance;
        if (start >= end) {
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
    vec3 hitNormal;
    float hitDist = rayMarch(rayOrigin,rayDir,minDist,maxDist,material,hitNormal);
    vec4 color;
    if(hitDist < maxDist){
        vec3 hitPoint = rayOrigin + hitDist * rayDir;
        color = calcMaterialLighting(hitPoint,material,hitNormal);
        if(material.reflectivity > 0.0){
            vec3 reflectDir = reflect(rayDir,hitNormal);
            vec3 reflectOrigin = hitPoint + reflectDir * .01;

            Material reflectedMaterial;
            vec3 reflectedNormal;
            float reflectDist = rayMarch(reflectOrigin,reflectDir,0.001,maxDist,reflectedMaterial,reflectedNormal);

            if(reflectDist < maxDist){
                vec3 reflectPoint = reflectOrigin + reflectDist * reflectDir;
                vec4 reflectColor = calcMaterialLighting(reflectPoint,reflectedMaterial,reflectedNormal);
                color = mix(color,reflectColor,material.reflectivity);
            }

        }
    }else{
        color = vec4(0.5,0.5,0.5,1.0);
    }
    FragColor = color;

}
