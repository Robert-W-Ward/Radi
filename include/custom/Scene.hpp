#pragma once
#include <fstream>
#include <iostream>
#include <string>
#include "Shader.hpp"
#include "Object.hpp"

namespace Radi::Types
{
	class Scene
	{
	public:
		Scene();
		Scene(std::vector<Object *> &objs);
		virtual ~Scene()=0;
		virtual void LoadSceneFromJson(const std::string &path) = 0;
		virtual void Render(Shader *shader) = 0;
		virtual std::vector<Object *> *GetObjects();

	private:
		std::vector<Object *> *objects;
	};
}
