#include "Camera.hpp"
#include <glm/glm.hpp>
Radi::Types::Camera::Camera(glm::vec3 pos, glm::vec3 upDir,glm::vec3 frontDir,glm::vec3 rightDir, float fov, float rotSpeed,float yaw,float pitch,float sens){
    Position = pos;
    UpDir = upDir;
    FrontDirection = frontDir;
    Fov = fov;
    RotationSpeed = rotSpeed;
    Yaw = yaw;
    Pitch = pitch;
    Sensitivity = sens;
    RightDir = rightDir;
    WorldUp = glm::vec3(0.0f,1.0f,0.0f);
}   
Radi::Types::Camera::Camera(){}
void Radi::Types::Camera::UpdateCameraDirection(){
    glm::vec3 front;
    front.x = cos(glm::radians(Yaw)) * cos(glm::radians(Pitch));
    front.y = sin(glm::radians(Pitch));
    front.z = sin(glm::radians(Yaw)) * cos(glm::radians(Pitch));
    this->FrontDirection = glm::normalize(front);
    this->RightDir = glm::normalize(glm::cross(this->FrontDirection, this->WorldUp));  
    this->UpDir = glm::normalize(glm::cross(this->RightDir, this->FrontDirection));
}

Radi::Types::Camera::~Camera(){}