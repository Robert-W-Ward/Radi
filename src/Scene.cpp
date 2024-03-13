#include "Scene.hpp"
namespace Radi::Types {
   Scene::Scene(){
      // Subscribe to events
       window.RegisterKeyPressCallback([this](int key, int scancode, int action, int mods) {
          this->OnKeyPress(key, scancode, action, mods);
       });
      window.RegisterFramebufferSizeCallback([this](int width, int height) {
         this->OnResize(width, height);
      });
      // Register callbacks
   }
   Scene::~Scene(){}
   
   void Scene::ProcessInput(float deltaTime){
      
   }
   void Scene::Update(float deltaTime){
      
   }
   void Scene::Render() {
      if(shader){
         shader->use();
         glBindVertexArray(shader->VAO);
         glDrawArrays(GL_TRIANGLES,0,6);
         glBindVertexArray(0);
      }
   }
   void Scene::OnResize(int width, int height){
      // TODO Implement
      if(shader){
         shader->setInt("VP_X",width);
         shader->setInt("VP_Y",height);
      }
      std::cout<<"Window resized: "<<width<<"x"<<height<<std::endl;
   }
   void Scene::OnKeyPress(int key, int scancode, int action, int mods) {
      // TODO Implement
      std::cout<<"Key pressed: "<<key<<std::endl;
   }

   std::vector<Primative> Scene::GetObjects(){
      return this->objects;
   }
   std::vector<Light> Scene::GetLights(){
      return this->lights;
   }
   std::vector<Material> Scene::GetMaterials(){
      return this->materials;
   }
   
   void Scene::SetRenderingMethod(RenderingMethod method){
      this->renderingMethod = method;
   }
   RenderingMethod Scene::GetRenderingMethod(){
      return this->renderingMethod;
   }
   
   void Scene::SetActiveShader(std::unique_ptr<Shader> shaderPtr){
      shader = std::move(shaderPtr);
   }
   Shader* Scene::GetActiveShader(){
      return shader.get();
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
      if (sceneJson.contains("primatives")) {
         for (const auto& objJson : sceneJson["primatives"]) {
               // Assume Object::createFromJson is a static method that creates an Object* from JSON
               objects.push_back(*Primative::createFromJson(objJson));
         }
      }

      // Parse lights
      if (sceneJson.contains("lights")) {
         for (const auto& lightJson : sceneJson["lights"]) {
               // Similar to Object, assuming a createFromJson method for Light
               lights.push_back(*Light::createFromJson(lightJson));
         }
      }

      // Parse materials
      if (sceneJson.contains("materials")) {
         for (const auto& matJson : sceneJson["materials"]) {
               // Assuming Material::createFromJson exists
               materials.push_back(*Material::createFromJson(matJson));
         }
      }

      // Close the file
      file.close();
   }
   void Scene::LoadSceneToGPU() {
      // Upload Object data
      glGenBuffers(1,&objSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,objSSBO);
      glBufferData(GL_SHADER_STORAGE_BUFFER,sizeof(Primative) * objects.size(),objects.data(),GL_STATIC_DRAW);
      glBindBufferBase(GL_SHADER_STORAGE_BUFFER,0,objSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,0);

      // Upload Material data
      glGenBuffers(1,&matSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,matSSBO);
      glBufferData(GL_SHADER_STORAGE_BUFFER,sizeof(Material) * materials.size(),materials.data(),GL_STATIC_DRAW);
      glBindBufferBase(GL_SHADER_STORAGE_BUFFER,1,matSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,0);

      // // Upload Light data
      glGenBuffers(1,&lightSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,lightSSBO);
      glBufferData(GL_SHADER_STORAGE_BUFFER,sizeof(Light) * lights.size(),lights.data(),GL_STATIC_DRAW);
      glBindBufferBase(GL_SHADER_STORAGE_BUFFER,2,lightSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,0);

      // Upload Camera data
      glGenBuffers(1,&cameraSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,cameraSSBO);
      glBufferData(GL_SHADER_STORAGE_BUFFER,sizeof(Camera),camera.get(),GL_STATIC_DRAW);
      glBindBufferBase(GL_SHADER_STORAGE_BUFFER,3,cameraSSBO);
      glBindBuffer(GL_SHADER_STORAGE_BUFFER,0);

   }

   void Scene::Configure(){
      if(renderingMethod == RenderingMethod::Rasterized){
         // TODO: Load mesh data
      }else{
         shader->setUpFullscreenQuad();
         LoadSceneToGPU();
      }
   }

}