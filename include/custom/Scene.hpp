#pragma once
#include <fstream>
#include <iostream>
#include <string>
#include <nlohmann/json.hpp>
#include <memory>
#include "Window.hpp"
#include "Shader.hpp"
#include "Object.hpp"
#include "Material.hpp"
#include "Camera.hpp"
#include "Light.hpp"

namespace Radi::Types
{
	enum class RenderingMethod {Rasterized, RayTraced, RayMarched};
	class Scene
	{
		public:
			// Constructor
			Scene();
			~Scene();

			//Parametrized Constructor
			Scene(std::vector<Object*> &objs);
			void Render();
			void LoadSceneFromFile(const std::string &path);

			std::vector<Object*> GetObjects();
			std::vector<Light*> GetLights();
			std::vector<Material*> GetMaterials();
			RenderingMethod GetRenderingMethod();
			void SetRenderingMethod(RenderingMethod method);
			void SetActiveShader(std::unique_ptr<Shader> shaderPtr);

			void ProcessInput(float deltaTime);
			void Update(float deltaTime);
			void LoadSceneToGPU();
			void OnKeyPress(int key, int scancode, int action, int mods);
			std::unique_ptr<Camera> camera;
		private:
			void setupFullscreenQuad();
			void Configure();
			Window& window = Window::Get();
			RenderingMethod renderingMethod;
			std::unique_ptr<Shader> shader;
			std::vector<Object*> objects;
			std::vector<Material*> materials;
			std::vector<Light*> lights;
			unsigned int VAO, VBO;
			GLuint objSSBO;
			GLuint matSSBO;
			GLuint lightSSBO;
	};
}
