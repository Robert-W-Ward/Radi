// raytrace.frag
#version 330 core

out vec4 FragColor;

uniform vec3 camPos;          // Camera position
uniform vec3 camDir;          // Camera direction
uniform vec3 camUp;           // Camera up vector
uniform vec3 camRight;        // Camera right vector
uniform float camFOV;         // Camera field of view
uniform float aspectRatio;    // Aspect ratio of the window
uniform float VP_X;
uniform float VP_Y;
vec3 lightPos = vec3(2.0,5.0,0.0);

float sphereSDF(vec3 rayPos, vec3 sphereCenter, float sphereRadius) {
    return length(rayPos - sphereCenter) - sphereRadius;
}
float boxSDF(vec3 pos, vec3 b){
    vec3 q = abs(pos) - b;
    return length(max(q,0.0))+ min(max(q.x,max(q.y,q.z)),0.0);
}



float getDist(vec3 point){
    float SphereDist = sphereSDF(point, vec3(0.0), 1.0); 
    return SphereDist;
}

vec3 getNormal(vec3 p){
    float d = getDist(p);
    vec2 e = vec2(.01,0);
    vec3 n = d - vec3(
        getDist(p-e.xyy), //- getDist(p-e.xyy),
        getDist(p-e.yxy),// - getDist(p-e.yxy),
        getDist(p-e.yyx));// - getDist(p-e.yyx));

    return normalize(n);
}

float getLight(vec3 point){
   vec3 light = normalize(lightPos - point);
   vec3 normal = getNormal(point);
   float diff = max(dot(normal,light),0.0);
   return diff;
}

vec3 getRayDir(vec2 screenCoords){
    float scale = tan(radians(camFOV*0.5));
    vec2 screenPos = screenCoords * scale;
    screenPos.x *= aspectRatio;
    return normalize(camRight*screenPos.x + camUp * screenPos.y + camDir);
}

// Ray marching function
float rayMarch(vec3 rayOrigin, vec3 rayDir, float start, float end, float step) {
    float depth = start;
    for (float i = 0.0; i < 100.0; i++) {
        vec3 pos = rayOrigin + depth * rayDir;
        float distance = getDist(pos);

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

    vec3 rayDir = getRayDir(screenCoords);
    float dist = rayMarch(camPos,rayDir,0.0,100.0,0.1);

    vec3 p = camPos + rayDir * dist;


    if(dist<100.0){
        vec3 p = camPos + dist * rayDir;
        float lightIntensity = getLight(p);
        vec3 normal = getNormal(p);
        vec3 color = normal; //vec3(1.0,1.0,1.0) * lightIntensity;
        FragColor = vec4(color,1.0);

    }else{

        FragColor = vec4(1.0,1.0,1.0, .5);
    }


}
