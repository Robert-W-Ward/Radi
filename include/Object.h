#ifndef OBJECT_H
#define OBJECT_H
#endif
#include "Transform.h"
namespace Radi::Types {
	class Object {
	public:
		Object();
		Object(std::vector<Vec3> verts);
		~Object();
		Transform _transform;
		std::vector<Vec3> _vertices;
	private:

	};
}