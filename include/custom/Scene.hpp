#pragma once
#include <fstream>
#include <iostream>
#include <string>
#include <nlohmann/json.hpp>
#include <memory>
#include "Window.hpp"
#include "Shader.hpp"
#include "Primative.hpp"
#include "Material.hpp"
#include "Camera.hpp"
#include "Light.hpp"

namespace Radi::Types
{
	enum class RenderingMethod {Rasterized, RayTraced, RayMarched};
	class Scene
	{
		public:
			std::unique_ptr<Camera> camera;
			
			// Constructor
			Scene();
			~Scene();

			std::vector<Primative> GetObjects();
			std::vector<Light> GetLights();
			std::vector<Material> GetMaterials();

			RenderingMethod GetRenderingMethod();
			void SetRenderingMethod(RenderingMethod method);

			Shader* GetActiveShader();
			void SetActiveShader(std::unique_ptr<Shader> shaderPtr);

			void ProcessInput(float deltaTime);
			void Update(float deltaTime);
			void Render();
			
			void LoadSceneFromFile(const std::string &path);
			void LoadSceneToGPU();
			
			void Configure();

			void OnKeyPress(int key, int scancode, int action, int mods);
		private:
			Window& window = Window::Get();
			RenderingMethod renderingMethod;
			std::unique_ptr<Shader> shader;
			std::vector<Primative> objects;
			std::vector<Material> materials;
			std::vector<Light> lights;
			GLuint objSSBO;
			GLuint matSSBO;
			GLuint lightSSBO;
	};
}
