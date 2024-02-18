#include "Scene.hpp"
#include "Shape3D.hpp"
#include "Light.hpp"
#include "nlohmann/json.hpp"
#include "RayMarchScene.hpp"
#include <vector>
namespace Radi::Types
{
    RayMarchScene::RayMarchScene(){}
    RayMarchScene::~RayMarchScene(){}

    std::vector<Radi::Types::Shape3D>* RayMarchScene::GetShapes(){
        return &this->shapes;
    }
    std::vector<Radi::Types::Light>* RayMarchScene::GetLights(){
        return &this->lights;
    }

    void RayMarchScene::LoadSceneFromJson(const std::string& path){
        std::ifstream file(path);
        if(!file.is_open()){
            std::cerr<<"Error: Unable to open file " << path <<std::endl;
        }
        nlohmann::json jsonData;
        file>>jsonData;
        file.close();
        for(const auto& obj: jsonData["Objects"]){
            Shape3D shape;
            shape.type = static_cast<int>(obj["Type"].get<int>());

            shape.position = glm::vec4(
                obj["Position"]["x"].get<float>(),
                obj["Position"]["y"].get<float>(),
                obj["Position"]["z"].get<float>(),
                obj["Position"]["w"].get<float>()
            );

            shape.dimensions = glm::vec4(
                obj["Dimensions"]["x"].get<float>(),
                obj["Dimensions"]["y"].get<float>(),
                obj["Dimensions"]["z"].get<float>(),
                obj["Dimensions"]["w"].get<float>()
            );

            shape.extra = glm::vec4(
                obj["Extra"]["x"].get<float>(),
                obj["Extra"]["y"].get<float>(),
                obj["Extra"]["z"].get<float>(),
                obj["Extra"]["w"].get<float>()
            );

            shape.material = {};

            shape.material.color = glm::vec4(
                obj["Material"]["Color"]["r"].get<float>(),
                obj["Material"]["Color"]["g"].get<float>(),
                obj["Material"]["Color"]["b"].get<float>(),
                obj["Material"]["Color"]["a"].get<float>()
            );

            shape.material.specular = obj["Material"]["Specular"].get<float>();
            shape.material.shininess = obj["Material"]["Shininess"].get<float>();
            shape.material.reflectivity = obj["Material"]["Reflectivity"].get<float>();
            this->shapes.push_back(shape);
        }
        for(const auto& obj: jsonData["Lights"]){
            Light light;
            light.type = static_cast<int>(obj["Type"].get<int>());
            light.position = glm::vec4(
                obj["Position"]["x"].get<float>(),
                obj["Position"]["y"].get<float>(),
                obj["Position"]["z"].get<float>(),
                obj["Position"]["w"].get<float>()
            );
            light.direction = glm::vec4(
                obj["Direction"]["x"].get<float>(),
                obj["Direction"]["y"].get<float>(),
                obj["Direction"]["z"].get<float>(),
                obj["Direction"]["w"].get<float>()
            );
            light.color = glm::vec4(
                obj["Color"]["r"].get<float>(),
                obj["Color"]["g"].get<float>(),
                obj["Color"]["b"].get<float>(),
                obj["Color"]["a"].get<float>()
            );
            light.intensity = obj["Intensity"].get<float>();
            this->lights.push_back(light);
        }
    }
    void RayMarchScene::Render(Radi::Types::Shader* shader){
        // Rendering for RayMarched scenes happens exclusively on the GPU
    }

} 
