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
out vec4 FragColor;
const int MAX_REFLECTION_DEPTH = 3;
float virtualTime;
vec4 BackgroundColor = vec4(0.5,0.5,0.5,1.0);
struct Material{vec4 color;float specular;float shininess; float reflectivity;float ior;};
struct Shape3D{int type;vec4 position;vec4 dimensions;vec4 extra;Material material;};
struct Hit{vec3 normal;Material material;vec3 point;float distance;vec4 accumulatedColor;};

struct Light{
    int type;
    vec4 position;
    vec4 direction;
    vec4 color;
    vec4 dimensions;
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
uniform float focusDistance;
uniform float aperture;
uniform float VP_X;           // Viewport X
uniform float VP_Y;           // Viewport Y
uniform bool isDebug;
uniform int u_samplesPerPixel;
uniform float time;
uniform bool motionBlurActive;

float random(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float dot2( in vec3 v ) { return dot(v,v); }
float checkerboardPattern(vec3 p) {
    float checkWidth = 1.0; // The width of each checker square
    float checksX = floor(p.x / checkWidth);
    float checksZ = floor(p.z / checkWidth);
    float pattern = mod(checksX + checksZ, 2.0); // Alternates between 0 and 1
    return pattern;
}
// //Gets the Ray direction throught he fullscreen quad based on the direction the camera is facing
vec3 getRayDir(vec2 screenCoords){
    float scale = tan(radians(camFOV*0.5));
    vec2 screenPos = screenCoords * scale;
    screenPos.x *= aspectRatio;
    return normalize(camRight*screenPos.x + camUp * screenPos.y + camDir);
}

float fresnel(vec3 viewDir, vec3 normal, float ior) {
    float f0 = pow((1.0 - ior) / (1.0 + ior), 2.0);
    float cosTheta = clamp(dot(viewDir, normal), 0.0, 1.0);
    return f0 + (1.0 - f0) * pow(1.0 - cosTheta, 5.0);
}

float sphereSDF(vec3 rayPos, vec3 sphereCenter, float sphereRadius) {
    return length(rayPos - sphereCenter) - sphereRadius;
}

vec3 rotateY(vec3 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
}

float sdBox(vec3 p, vec3 b, vec3 position, vec3 scale) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float udTriangle( vec3 p, vec3 a, vec3 b, vec3 c ){
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
        vec3 modifiedPos = shapes[i].position.xyz;
        vec3 position = shapes[i].position.xyz;
        vec3 dimensions = shapes[i].dimensions.xyz;
      

        switch(shapes[i].type){
            case SPHERE:
                distance = sphereSDF(point,shapes[i].position.xyz,shapes[i].dimensions.x);
                break;
            case BOX:
                if(true){
                    float angle = virtualTime;
                    vec3 pLocal = point - shapes[i].position.xyz;
                    pLocal = rotateY(pLocal,angle);
                    distance = sdBox(pLocal, dimensions.xyz / 2.0, vec3(0.0), vec3(1.0));
                }
                break;
            case TRIANGLE:
                distance = udTriangle(point,shapes[i].position.xyz,shapes[i].dimensions.xyz,shapes[i].extra.xyz);
                break;
            case PLANE:
                distance = sdPlane(point,normalize(shapes[i].position.xyz),shapes[i].dimensions.x);
                if (distance < closestDist) {
                    closestDist = distance;
                    hitMaterial = shapes[i].material;
                    
                    // Check if this point on the plane is close enough to consider for texturing
                    if (abs(distance) < 0.1) { // Arbitrary threshold for when to apply the texture
                        float pattern = checkerboardPattern(point);
                        if (pattern < 0.5) {
                            hitMaterial.color = vec4(vec3(0.0),1.0); // Black
                        } else {
                            hitMaterial.color = vec4(vec3(1.0),1.0); // White
                        }
                    }
                }
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
    return Material(vec4(0.75),.5,32.0,0.0,1.0);
}
Material backgroundMaterial(){
    return Material(vec4(0.0),1.0,1.0,0.0,1.0);
}

float ShadowRay(vec3 origin,vec3 dir,float maxDist,Light light){
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
vec4 CalculateLighting(Hit hit) {
    vec4 ambientColor = vec4(0.1, 0.1, 0.1, 1.0);
    vec4 diffuseColor = vec4(0.0);
    vec4 specularColor = vec4(0.0);

    for (int i = 0; i < lights.length(); ++i) {
        vec3 lightDir;
        float lightDist;
        float shadow = 1.0;
        float attenuation = 1.0;
        vec4 lightColor = lights[i].color * lights[i].intensity;

        // Calculate light direction and distance based on light type
        if (lights[i].type == DIRECTIONAL) {
            lightDir = normalize(-lights[i].direction.xyz);
            lightDist = 10000.0; // Use a large distance for directional lights
            shadow = ShadowRay(hit.point, lightDir, lightDist, lights[i]);
        } else if (lights[i].type == POINT_LIGHT) {
            lightDir = normalize(lights[i].position.xyz - hit.point);
            lightDist = length(lights[i].position.xyz - hit.point);
            shadow = ShadowRay(hit.point, lightDir, lightDist, lights[i]);
            float constant = 1.0;
            float linear = 0.09;
            float quadratic = 0.032;
            attenuation = 1.0 / (constant + linear * lightDist + quadratic * (lightDist * lightDist));
        }else if (lights[i].type == RECTANGLE_LIGHT) {
            vec3 rectangleNormal = normalize(lights[i].direction.xyz);
            float rectangleWidth = lights[i].dimensions.x;
            float rectangleHeight = lights[i].dimensions.y;
            int samples = 4; // Number of samples for approximation

            vec3 u = normalize(cross(rectangleNormal, vec3(0.0, 1.0, 0.0)));
            vec3 v = normalize(cross(rectangleNormal, u));
            u *= rectangleWidth * 0.5;
            v *= rectangleHeight * 0.5;

            for (int j = 0; j < samples; ++j) {
                float speed = 0.5;

                vec3 center = lights[i].position.xyz;
                vec3 movingPos = center + vec3(
                    cos(time * speed) * 10,
                    10,
                    sin(time*speed) * 10
                );
                vec3 samplePoint = movingPos + vec3(
                    (float(j) / float(samples) - 0.5) * lights[i].dimensions.x,
                    0,
                    (float(j) / float(samples) - 0.5) * lights[i].dimensions.z
                );
                // Calculate light direction and distance for the sample
                lightDir = normalize(samplePoint - hit.point);
                lightDist = length(samplePoint - hit.point);

                // Shadow and attenuation calculation similar to point light but for each sample
                shadow = ShadowRay(hit.point, lightDir, lightDist, lights[i]);
                // Assuming linear attenuation for simplicity; could be modified for realistic falloff
                attenuation = 1.0 / (1.0 + 0.09 * lightDist + 0.032 * (lightDist * lightDist));

                // Calculate diffuse and specular contribution from this sample
                float diffuseSample = max(dot(hit.normal, lightDir), 0.0) * attenuation * shadow;
                vec3 specularReflectDir = reflect(-lightDir, hit.normal);
                float specularSample = pow(max(dot(camDir, specularReflectDir), 0.0), hit.material.shininess) * attenuation * shadow;

                // Accumulate contributions from all samples
                vec4 sampleLightColor = (diffuseSample * lightColor * hit.material.color) + (specularSample * vec4(1.0, 1.0, 1.0, 1.0) * hit.material.specular);
                diffuseColor += sampleLightColor / float(samples);
                specularColor += sampleLightColor / float(samples);
            }
        }else if (lights[i].type == DISC){}
        if(lights[i].type!= RECTANGLE_LIGHT){
            // Calculate diffuse and specular components
            float diffuse = max(dot(hit.normal, lightDir), 0.0) * attenuation * shadow;
            vec3 specularReflectDir = reflect(lightDir, hit.normal);
            float specular = pow(max(dot(camDir, specularReflectDir), 0.0), hit.material.shininess) * attenuation * shadow;

            // Accumulate lighting contributions
            vec4 totalLightColor = (diffuse * lightColor * hit.material.color) + (specular * vec4(1.0, 1.0, 1.0, 1.0) * hit.material.specular);
            vec4 diffuseContribution = diffuse * lightColor * hit.material.color;
            vec4 specularContribution = specular * vec4(1.0, 1.0, 1.0, 1.0) * hit.material.specular;

            diffuseColor += diffuseContribution;
            specularColor += specularContribution; 

        }
    }

    vec4 lightingColor = ambientColor + diffuseColor + specularColor;
    lightingColor.a = hit.material.color.a; 
    return lightingColor;
}

bool RayMarch(vec3 ro, vec3 rd, out Hit hit){
    //out vec4 color, out vec3 hitPoint, out vec3 hitNormal, out Material mat
    float depth = 0.0;
    float maxDepth = 1000.0;
    vec4 accumulatedColor = vec4(0.0);
    float accumulatedAlpha = 0.0;
    bool hitSomething = false;
    for (int i=0;i<100 && depth < maxDepth;++i){
        vec3 p = ro + rd * depth;
        float dist = SceneSDF(p,hit.material);

        if(dist<0.001){
            hitSomething = true;
            hit.point = p;
            hit.normal = CalculateNormal(p,0.001);
            hit.distance = depth;
            hit.accumulatedColor = CalculateLighting(hit);
            hit.accumulatedColor.rgb *= hit.accumulatedColor.a;
            accumulatedColor += (1.0 - accumulatedAlpha) * hit.accumulatedColor;
            accumulatedAlpha += (1.0 - accumulatedAlpha) * hit.accumulatedColor.a;
            if(accumulatedAlpha >= 1.0) break;
            depth += 4;
        }
        depth+= dist;
    }
    return hitSomething;
}

vec4 CalculateColor(vec3 rd, Hit hit){
    vec4 reflectionColor = vec4(0.0);
    vec4 refractionColor = vec4(0.0);
    vec4 combinedColor = vec4(0.0);
    float fresnelEffect = fresnel(rd,hit.normal,hit.material.ior);
    // Reflection
    if(hit.material.reflectivity>0.0){
        vec3 reflectDir = reflect(rd, hit.normal);
        vec3 reflectOrigin = hit.point + hit.normal * 0.01;
        Hit reflectHit;
        if(RayMarch(reflectOrigin,reflectDir,reflectHit)){
            reflectionColor = reflectHit.accumulatedColor;
        }else{
            reflectionColor = BackgroundColor;
        }
    }
    // Refraction
    if (hit.material.color.a < 1.0) { 
        vec3 refractDir = refract(normalize(rd), hit.normal, 1.0 / hit.material.ior);
        vec3 refractOrigin = hit.point - hit.normal * 0.001; 
        Hit refractHit;
        if (RayMarch(refractOrigin, refractDir, refractHit)) {
            refractionColor = refractHit.accumulatedColor; 
        } else {
            refractionColor = BackgroundColor; 
        }
    }
    combinedColor += reflectionColor * fresnelEffect; 
    combinedColor += refractionColor * (1.0 - fresnelEffect); 
    combinedColor = mix(hit.accumulatedColor, combinedColor, hit.material.reflectivity);       

    combinedColor.a = hit.accumulatedColor.a;
    return combinedColor;
}
vec2 concentricSampleDisk(float u, float v) {
    float phi, r;
    float a = 2.0 * u - 1.0;
    float b = 2.0 * v - 1.0;
    float PI = 3.14159;
    if (a == 0.0 && b == 0.0) {
        return vec2(0, 0);
    }

    if (a * a > b * b) { 
        r = a;
        phi = (PI / 4.0) * (b / a);
    } else {
        r = b;
        phi = (PI / 2.0) - (PI / 4.0) * (a / b);
    }

    return r * vec2(cos(phi), sin(phi));
}

void main() {
    //screen setup
    vec2 screenCoords = (gl_FragCoord.xy / vec2(VP_X, VP_Y)) * 2.0 - 1.0;
    vec4 colorWithoutBlur = vec4(0.0);
    vec4 colorWithBlur = vec4(0.0);
    vec3 ro = camPos;
    vec3 rd = getRayDir(screenCoords);
    int samples = int(float(u_samplesPerPixel*u_samplesPerPixel));
    vec4 accumulatedColor = vec4(0.0);
    Hit hit;
    if(motionBlurActive){
        int timeSamples = 5;
        float blurDur = .2;
        for(int ts = 0;ts < timeSamples; ++ts){
            virtualTime = time + (float(ts) / float(timeSamples - 1) - 0.5) * blurDur;
            Hit hit; 
            if (RayMarch(ro, rd, hit)) {
                colorWithBlur += CalculateColor(rd, hit);
            } else {
                colorWithBlur += BackgroundColor;
            }
        }
        colorWithBlur /= float(timeSamples);
    }else{
        for (int sx = 0; sx < samples; ++sx) {
            for (int sy = 0; sy < samples; ++sy) {
                // Calculate the size of each stratum
                float stratumWidth = 1.0 / float(samples);

                // Jitter screen coordinates within each pixel's subarea
                float jitterX = (float(sx) + random(gl_FragCoord.xy + vec2(sx, sy))) * stratumWidth;
                float jitterY = (float(sy) + random(gl_FragCoord.xy + vec2(sx, sy))) * stratumWidth;
                vec2 jitteredScreenCoords = screenCoords + (vec2(jitterX, jitterY) - 0.5) / vec2(VP_X, VP_Y);

                vec3 rd = getRayDir(jitteredScreenCoords); // Recalculate rd with jitter applied

                vec2 diskSample = concentricSampleDisk(jitterX, jitterY);
                vec2 apertureOffset = aperture * diskSample;
                vec3 newRayOrigin = ro + camRight * apertureOffset.x + camUp * apertureOffset.y;
                vec3 focalPoint = ro + rd * focusDistance; 
                vec3 newRayDir = normalize(focalPoint - newRayOrigin);

                // Perform ray marching and accumulate color
                if (RayMarch(newRayOrigin, newRayDir, hit)) {
                    accumulatedColor += CalculateColor(rd,hit);
                } else {
                    accumulatedColor += BackgroundColor;
                }
                
                if (isDebug  && abs(jitterX - 0.5 / float(samples)) < 0.05 && abs(jitterY - 0.5 / float(samples)) < 0.05) {
                    accumulatedColor = vec4(1.0,1.0,0.0,1.0);
                    return;
                }
            } 
        }
        accumulatedColor = accumulatedColor / float(samples*samples);
    }
    FragColor = motionBlurActive ? colorWithBlur: accumulatedColor;  
    if(isDebug)
        FragColor = vec4(hit.normal,1.0);
}   