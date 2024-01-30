# CMakeList.txt : CMake project for Radi, include source and define
# project specific logic here.
#
cmake_minimum_required (VERSION 3.8)

# Enable Hot Reload for MSVC compilers if supported.
if (POLICY CMP0141)
  cmake_policy(SET CMP0141 NEW)
  set(CMAKE_MSVC_DEBUG_INFORMATION_FORMAT "$<IF:$<AND:$<C_COMPILER_ID:MSVC>,$<CXX_COMPILER_ID:MSVC>>,$<$<CONFIG:Debug,RelWithDebInfo>:EditAndContinue>,$<$<CONFIG:Debug,RelWithDebInfo>:ProgramDatabase>>")
endif()


if (POLICY CMP0091)
  cmake_policy(SET CMP0091 NEW)
endif()
include (${CMAKE_BINARY_DIR}/conan_toolchain.cmake)
project ("Radi")
# Set the output directory for binaries

# Add source to this project's executable.
add_executable (Radi "src/Radi.cpp" "include/Radi.h")

# Add pacakges
find_package(glfw3 REQUIRED) 
find_package(glad REQUIRED)
# Link
target_link_libraries(Radi PRIVATE glfw)
target_link_libraries(Radi PRIVATE glad::glad)

if (CMAKE_VERSION VERSION_GREATER 3.12)
  set_property(TARGET Radi PROPERTY CXX_STANDARD 20)
endif()

# TODO: Add tests and install targets if needed.
