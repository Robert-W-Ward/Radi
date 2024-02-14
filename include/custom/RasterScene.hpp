#pragma once
#include "Scene.hpp"

namespace Radi::Types
{
    class RasterScene : public Scene
    {
    public:
        RasterScene();
        ~RasterScene();
        void LoadSceneFromJson(const std::string &path) override;
        void Render(Radi::Types::Shader *shader) override;
        std::vector<Radi::Types::Object *> *GetObjects() override;
    };
}
