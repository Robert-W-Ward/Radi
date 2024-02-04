#ifndef TRANSFORM_H
#define TRANSFORM_H
#endif
#include "Radi.hpp"
namespace Radi::Types {
	class Transform
	{
		using Vec3 = std::tuple<float, float, float>;
		public:	
			Transform();
			~Transform();
			Vec3 position;
			Vec3 rotation;
			Vec3 scale;
		private:
	};
}