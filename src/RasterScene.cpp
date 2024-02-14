#include "Scene.hpp"
#include "nlohmann/json.hpp"

namespace Radi::Types
{
    class RasterScene : public Scene{

        public:
        RasterScene():Scene(){}
        RasterScene(std::vector<Object*>& objs):Scene(objs){}
		
        ~RasterScene(){}


        void LoadSceneFromJson(const std::string& path) override{
        	std::ifstream file(path);
        	nlohmann::json sceneJson;
			auto objs = this->GetObjects();
        	if(file.is_open()){
        		file>>sceneJson;
        	}else{
        		std::cerr << "Failed to open " <<path<< std::endl;
        	}
        	if(!objs){
        		objs = new std::vector<Object*>;
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

        		objs->push_back(newObj);
        	}        
        }

        void Render(Radi::Types::Shader* shader){
			auto objects = this->GetObjects();
        	for (auto& obj: *objects)
        	{
        		glm::mat4 model = glm::mat4(1.0f);
        		shader->setMat4("model",model);
        		obj->Render();
            }      
        }
    };
} 
