#ifndef SCENE_H
#define SCENE_H
#endif // !SCENE_H


#include "Object.hpp"


namespace Radi::Types{
	class Scene
	{
		public:
			Scene();
			Scene(std::vector<Object*> objs);
			~Scene();
			std::vector<Object*> _objects;
		private:

	};
}
