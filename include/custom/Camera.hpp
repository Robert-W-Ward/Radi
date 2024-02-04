#include <glm/glm.hpp>
namespace Radi::Types
{
    struct Camera
    {
        glm::vec3 Position;
        glm::vec3 UpDir;
        glm::vec3 FrontDirection;
        glm::vec3 RightDir;
        float Fov;
        float RotationSpeed;
        float Yaw;
        float Pitch;
        float Sensitivity;
        glm::vec3 WorldUp;
        Camera();
        Camera(glm::vec3 pos, glm::vec3 upDir,glm::vec3 frontDir,glm::vec3 rightDir, float fov, float rotSpeed,float yaw,float pitch,float sens);
        void UpdateCameraDirection();
        ~Camera();
    };    
} 
