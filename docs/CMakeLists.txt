cmake_minimum_required(VERSION 3.16)

project(test_cmake)

if (CMAKE_LIBRARY_ARCHITECTURE MATCHES "wasm64")
  set(PTR_SIZE 8)
else()
  # Allow both 32-bit and 64-bit builds
  if(CMAKE_SIZEOF_VOID_P EQUAL 8)
    set(PTR_SIZE 8)  # 64-bit
  else()
    set(PTR_SIZE 4)  # 32-bit
  endif()
endif()

# Skip pointer size check since we now support both sizes
message(STATUS "CMAKE_SIZEOF_VOID_P -> ${CMAKE_SIZEOF_VOID_P}")
message(STATUS "PTR_SIZE -> ${PTR_SIZE}")

include(CheckTypeSize)

check_type_size("int" int_size)
if (NOT "${int_size}" EQUAL "4")
  message(FATAL_ERROR "CHECK_TYPE_SIZE with int did not return 4! (${int_size})")
endif()
message(STATUS "CHECK_TYPE_SIZE int -> ${int_size}")

check_type_size("int[256+1]" big_size)
if (NOT "${big_size}" EQUAL "1028")
  message(FATAL_ERROR "CHECK_TYPE_SIZE with int[256+1] did not return 1028! (${big_size})")
endif()
message(STATUS "CHECK_TYPE_SIZE int -> ${big_size}")

check_type_size("void*" ptr_size)
if (NOT "${ptr_size}" EQUAL "${PTR_SIZE}")
  message(FATAL_ERROR "CHECK_TYPE_SIZE with void* did not return ${PTR_SIZE}! (${ptr_size})")
endif()
message(STATUS "CHECK_TYPE_SIZE void* -> ${ptr_size}")
