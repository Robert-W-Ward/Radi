#include "Material.hpp"
#pragma once
namespace Radi::Types
{
      struct alignas(16) PBRMaterial : Material{
        float metallic;
        float roughness;
        float ao;
        glm::vec3 albedo;
        
        void use(unsigned int program) const override{
            Material::use(program);
            unsigned int metallicLoc = glGetUniformLocation(program,"material.metallic");
            unsigned int roughnessLoc = glGetUniformLocation(program,"material.roughness");
            unsigned int aoLoc = glGetUniformLocation(program,"material.ao");
            unsigned int albedoLoc = glGetUniformLocation(program,"material.albedo");
            
            glUniform1f(metallicLoc,metallic);
            glUniform1f(roughnessLoc,roughness);
            glUniform1f(aoLoc,ao);
            glUniform3fv(albedoLoc,1,&albedo[0]);
        }
    };
    
}