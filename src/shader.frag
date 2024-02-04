#version 330 core
out vec4 FragColor;

uniform vec3 cameraPos;
uniform vec3 cameraFront;
uniform vec3 cameraRight;
uniform vec3 cameraUp;
uniform float fov;

uniform float aspectRatio;
uniform vec2 screenSize;

uniform float sphereRadius = 1.0;
uniform vec3 sphereCenter = vec3(0.0,0.0,-1.0);
float rayMarch(vec3 rayOrigin, vec3 rayDir, vec3 center, float radius) {
    vec3 oc = rayOrigin - center;
    float a = dot(rayDir, rayDir);
    float b = 2.0 * dot(oc, rayDir);
    float c = dot(oc, oc) - radius * radius;
    float discriminant = b * b - 4 * a * c;
    if (discriminant < 0.0) {
        return -1.0; // No intersection
    } else {
        return (-b - sqrt(discriminant)) / (2.0 * a); // Return the distance to the intersection
    }
}

// Main function
void main() {


    FragColor = vec4(1.0,1.0,0.0,1.0);
    return;
    vec2 ndc = (gl_FragCoord.xy / screenSize) * 2.0 - 1.0;
    ndc.x *= aspectRatio;

    float tanHalfFov = tan(radians(fov)/2.0);
    vec3 rayDirViewSpace = normalize(vec3(ndc.x * tanHalfFov, ndc.y * tanHalfFov, -1.0));
    vec3 rayDirWorldSpace = normalize(rayDirViewSpace.x * cameraRight + rayDirViewSpace.y * cameraUp + rayDirViewSpace.z * cameraFront);
    float dist = rayMarch(cameraPos, rayDirWorldSpace, sphereCenter, sphereRadius);

    if (dist > 0.0) {
        FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color if hit
    } else {
        FragColor = vec4(0.0, 0.0, 0.0, 1.0); // Black color if no hit
    }
}