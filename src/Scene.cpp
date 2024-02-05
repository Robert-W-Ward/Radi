#include "Scene.hpp"
#include "nlohmann/json.hpp"
#include "glm/glm.hpp"
#include "Shader.hpp"

namespace Radi::Types{
	Scene::Scene():objects(nullptr){}
	Scene::Scene(std::vector<Object*>& objs):objects(&objs){}
	void Scene::LoadSceneFromJson(const std::string& path){
		std::ifstream file(path);
		nlohmann::json sceneJson;
		if(file.is_open()){
			file>>sceneJson;
		}else{
			std::cerr << "Failed to open " <<path<< std::endl;
		}
		if(!objects){
			objects = new std::vector<Object*>;
		}
		for(auto& obj:sceneJson["Objects"]){
			std::vector<glm::vec3> vertices;
			std::vector<glm::vec3> colors;
			for(auto& vert:obj["Vertices"]){
				vertices.push_back(glm::vec3(vert["x"],vert["y"],vert["z"]));
			}
			for(auto& color:obj["Colors"]){
				colors.push_back(glm::vec3(color["r"],color["g"],color["b"]));
			}

			Radi::Types::Object* newObj = new Radi::Types::Object();
			newObj->Initialize(vertices,colors);

			objects->push_back(newObj);
    	}
	}

	void Scene::Render(Radi::Types::Shader* shader){
		for (auto& obj: *objects)
		{
			glm::mat4 model = glm::mat4(1.0f);
			shader->setMat4("model",model);
			obj->Render();

		}
		
	}
}