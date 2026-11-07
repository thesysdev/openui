#ifndef OPENUI_REGEXP_H
#define OPENUI_REGEXP_H
#include <stddef.h>
#include <stdint.h>
#ifdef __cplusplus
extern "C" {
#endif
/* 1: match, 0: no match, -1: syntax error, -2: execution/resource error.
   Both strings are raw UTF-16 units. No Unicode or other RegExp flag is set. */
int openui_regexp_test(const uint16_t *pattern, size_t pattern_length,
                       const uint16_t *value, size_t value_length);
#ifdef __cplusplus
}
#endif
#endif
