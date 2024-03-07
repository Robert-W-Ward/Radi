#include "Scene.hpp"
namespace Radi::Types {
   Scene::Scene(){}
   Scene::~Scene(){}
   Scene::Scene(std::vector<Object*>&objs){
       objects = objs;
       renderingMethod = RenderingMethod::Rasterized;
       Configure();
       // Subscribe to events
       window.RegisterKeyPressCallback([this](int key, int scancode, int action, int mods) {
          this->OnKeyPress(key, scancode, action, mods);
       });
       // Register callbacks

   }
   
   void Scene::Render() {
      
   }
   void Scene::Configure() {
      if(renderingMethod == RenderingMethod::Rasterized){
         //if rasterized need to load mesh data as well
      }else if(renderingMethod == RenderingMethod::RayTraced ||renderingMethod == RenderingMethod::RayMarched){
         setupFullscreenQuad();
      }
      LoadSceneToGPU();
   }
   void Scene::ProcessInput(float deltaTime){
      
   }
   void Scene::OnKeyPress(int key, int scancode, int action, int mods) {
      // TODO Implement
   }
   void Scene::Update(float deltaTime){
      
   }
   std::vector<Object*> Scene::GetObjects(){
      return this->objects;
   }
   std::vector<Light*> Scene::GetLights(){
      return this->lights;
   }
   std::vector<Material*> Scene::GetMaterials(){
      return this->materials;
   }
   RenderingMethod Scene::GetRenderingMethod(){
      return this->renderingMethod;
   }
   void Scene::SetRenderingMethod(RenderingMethod method){
      this->renderingMethod = method;
      Configure();
   }
   void Scene::SetActiveShader(std::unique_ptr<Shader> shaderPtr){
      shader = std::move(shaderPtr);
   }
   void Scene::LoadSceneFromFile(const std::string &path) {
      std::ifstream file(path);
      nlohmann::json sceneJson;
      file >> sceneJson;

      // Parse rendering method
      std::string method = sceneJson["renderingMethod"];
      if (method == "Rasterized") {
         renderingMethod = RenderingMethod::Rasterized;
      } else if (method == "RayTraced") {
         renderingMethod = RenderingMethod::RayTraced;
      } else if (method == "Marched") {
         renderingMethod = RenderingMethod::RayMarched;
      }

      // Parse camera (assuming a function exists to create a Camera from JSON)
      if (sceneJson.contains("camera")) {
         camera = std::unique_ptr<Camera>(Camera::createFromJson(sceneJson["camera"]));
      }

      // Parse objects
      if (sceneJson.contains("objects")) {
         for (const auto& objJson : sceneJson["objects"]) {
               // Assume Object::createFromJson is a static method that creates an Object* from JSON
               objects.push_back(Object::createFromJson(objJson));
         }
      }

      // Parse lights
      if (sceneJson.contains("lights")) {
         for (const auto& lightJson : sceneJson["lights"]) {
               // Similar to Object, assuming a createFromJson method for Light
               lights.push_back(Light::createFromJson(lightJson));
         }
      }

      // Parse materials
      if (sceneJson.contains("materials")) {
         for (const auto& matJson : sceneJson["materials"]) {
               // Assuming Material::createFromJson exists
               materials.push_back(Material::createFromJson(matJson));
         }
      }

      // Close the file
      file.close();
   }
   void Scene::LoadSceneToGPU() {
      // Upload Object data
      glGenBuffers(1,&objSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,objSSBO);
      glBufferData(GL_SHADER_STORAGE_BUFFER,sizeof(glm::mat4) * objects.size(),objects.data(),GL_STATIC_DRAW);
      glBindBufferBase(GL_SHADER_STORAGE_BUFFER,0,objSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,0);

      // Upload Material data
      glGenBuffers(1,&matSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,matSSBO);
      glBufferData(GL_SHADER_STORAGE_BUFFER,sizeof(Material) * materials.size(),materials.data(),GL_STATIC_DRAW);
      glBindBufferBase(GL_SHADER_STORAGE_BUFFER,1,matSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,0);

      // Upload Light data
      glGenBuffers(1,&lightSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,lightSSBO);
      glBufferData(GL_SHADER_STORAGE_BUFFER,sizeof(Light) * lights.size(),lights.data(),GL_STATIC_DRAW);
      glBindBufferBase(GL_SHADER_STORAGE_BUFFER,2,lightSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,0);
   }
   void Scene::setupFullscreenQuad() {
      float vertices[] = {
         // positions
         -1.0f,  1.0f, 0.0f, // Top Left
         -1.0f, -1.0f, 0.0f, // Bottom Left
         1.0f, -1.0f, 0.0f, // Bottom Right
         -1.0f,  1.0f, 0.0f, // Top Left
         1.0f, -1.0f, 0.0f, // Bottom Right
         1.0f,  1.0f, 0.0f  // Top Right
      };

      glGenVertexArrays(1, &VAO);
      glGenBuffers(1, &VBO);

      glBindVertexArray(VAO);
      glBindBuffer(GL_ARRAY_BUFFER, VBO);
      glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);

      // Position attribute
      glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
      glEnableVertexAttribArray(0);

      glBindBuffer(GL_ARRAY_BUFFER, 0); 
      glBindVertexArray(0); 
   }

}