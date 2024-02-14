#include "Scene.hpp"
#include <vector>
namespace Radi::Types {
   Scene::Scene(){}
   Scene::Scene(std::vector<Object*>&objs){}
   Scene::~Scene(){}
   std::vector<Object*>* Scene::GetObjects(){ return this->objects;}
}