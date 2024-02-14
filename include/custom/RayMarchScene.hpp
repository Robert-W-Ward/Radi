#pragma once
#include "Scene.hpp"

namespace Radi::Types
{
    class RayMarchScene : public Scene
    {

    private:
        std::vector<Radi::Types::Shape3D> shapes;
        std::vector<Radi::Types::Light> lights;
    public:
        RayMarchScene();
        RayMarchScene(std::vector<Radi::Types::Shape3D> shapes,std::vector<Radi::Types::Light> lights);
        ~RayMarchScene();
        void LoadSceneFromJson(const std::string &path) override;
        void Render(Shader *shader) override;
        std::vector<Radi::Types::Shape3D>* GetShapes();
        std::vector<Radi::Types::Light>* GetLights();
    };
}
