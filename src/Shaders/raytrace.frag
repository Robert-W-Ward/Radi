// raytrace.frag
#version 460 core
const int MAX_SHAPES = 50;
#define SPHERE 0
#define BOX 1
#define TRIANGLE 2
#define PLANE 3


#define POINT_LIGHT 999
#define AREA 998
#define DIRECTIONAL 997

out vec4 FragColor;
const int MAX_REFLECTION_DEPTH = 3;
vec4 BackgroundColor = vec4(0.5,0.5,0.5,1.0);
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
    int type;
    vec4 position;
    vec4 direction;
    vec4 color;
    float intensity;
};

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
uniform float VP_X;           // Viewport X
uniform float VP_Y;           // Viewport Y
uniform bool isDebug;
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

Material defaultMaterial(){
    return Material(vec4(0.75),.5,32.0,0.0);
}
Material backgroundMaterial(){
    return Material(vec4(0.0),1.0,1.0,0.0);
}


float ShadowRay(vec3 origin,vec3 dir,float maxDist){
    float shadow = 1.0;
    float t = 0.01;
    Material mat;
    for(int i = 0;i<16;++i){
        vec3 pos = origin + dir * t;
        float h = SceneSDF(pos,mat);
        if(h<0.001){
            shadow = 0.0;
            break;
        }
        t+=h;
        if(t>=maxDist)break;
    }
    return shadow;
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

Hit MarchRay(vec3 origin, vec3 direction, int numberOfSteps, float MIN_HIT_DISTANCE,float MAX_TRAVEL_DIST){
    float totalDistance = 0.0;
    float distToSurface = 1e9;
    bool hasHit = false;
    vec3 normal;
    vec3 hitPoint;
    Material hitMaterial;

    for(float i = 0;i< numberOfSteps && totalDistance<MAX_TRAVEL_DIST; i+=.5){
        //RAY MARCH!
        vec3 position = origin + (totalDistance) * direction;
        //Calculate distance from nearest object in the scene
        distToSurface = SceneSDF(position,hitMaterial);
        //If the nearest object is close enough to be considered "hit" return
        if(distToSurface < MIN_HIT_DISTANCE){            
            return Hit(CalculateNormal(position,0.001),hitMaterial,position,totalDistance);
        }else{
            totalDistance += distToSurface;
        }
    }
    return Hit(vec3(0.0,0.0,0.0),backgroundMaterial(),origin + direction * MAX_TRAVEL_DIST,MAX_TRAVEL_DIST);
}
vec4 CalculateLighting(Hit hit){
    vec4 ambientColor = vec4(0.1,0.1,0.1,1.0);
    vec4 diffuseColor = vec4(0.0);
    vec4 specularColor = vec4(0.0);
    
    float lightDist = 1.0;

    for(int i = 0; i < lights.length();++i){
        vec3 lightDir;
        switch(lights[i].type){
            case POINT_LIGHT:
                lightDir = normalize(lights[i].position.xyz - hit.point);
                lightDist = length(lights[i].position.xyz - hit.point);
                break;
            case AREA:
                break;
            case DIRECTIONAL:
                lightDist = 10000.0;
                lightDir = normalize(-lights[i].direction.xyz);
                break;
            default:
                break;
        }        
        float shadow = ShadowRay(hit.point,lightDir,lightDist);

        float intensity = lights[i].intensity;
        vec4 lightColor = lights[i].color * intensity;

        float attenuation = 1.0;
        if(lights[i].type == POINT_LIGHT) {
            float constant = 1.0; // Constant attenuation factor
            float linear = 0.09; // Linear attenuation factor
            float quadratic = 0.032; // Quadratic attenuation factor
            attenuation = 1.0 / (constant + linear * lightDist + quadratic * (lightDist * lightDist));
        }



        // Diffuse
        float diffuse = max(dot(hit.normal, lightDir),0.0);
        diffuseColor += (diffuse * lightColor * hit.material.color)*attenuation *shadow;

        //Specular
        vec3 specularReflectDir = reflect(-lightDir,hit.normal);
        float specular = pow(max(dot(camDir,specularReflectDir),0.0),hit.material.shininess);
        specularColor +=  (specular * vec4(1.0,1.0,1.0,1.0) * hit.material.specular)*attenuation*shadow;
    }

    return ambientColor + diffuseColor + specularColor;
}

void main() {
    //screen setup
    vec2 screenCoords = (gl_FragCoord.xy / vec2(VP_X, VP_Y)) * 2.0 - 1.0;

    vec3 ro = camPos;
    vec3 rd = getRayDir(screenCoords);

    Hit h = MarchRay(ro,rd,100,0.001,1000);

    vec4 finalColor;


    if(h.distance < 100.0){
        finalColor = CalculateLighting(h);
        
        // Handle reflections
        vec4 reflectColor;
        if(h.material.reflectivity>0.0){
            vec3 reflectDir = reflect(normalize(rd), h.normal);
            vec3 reflectionOrigin = h.point + h.normal * 0.001;
            Hit reflectHit = MarchRay(reflectionOrigin, reflectDir,100, 0.001, 1000);

            if(reflectHit.distance < 100.0){
               reflectColor = CalculateLighting(reflectHit);
            }
            finalColor = mix(finalColor,reflectColor,h.material.reflectivity);
        }


    FragColor = finalColor;
    if(isDebug)
        FragColor = vec4(h.normal,1.0);
    }else{
        FragColor = BackgroundColor;
    }
}
