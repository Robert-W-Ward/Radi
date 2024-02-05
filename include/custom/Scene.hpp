#pragma once
#include <fstream>
#include <iostream>
#include <string>
#include "Shader.hpp"
#include "Object.hpp"


namespace Radi::Types{
	class Scene
	{
		public:
			Scene();
			Scene(std::vector<Object*>& objs);
			~Scene();
			void LoadSceneFromJson(const std::string& path);
			void Render(Radi::Types::Shader* shader);
		private:
			std::vector<Object*>* objects;

	};
}
