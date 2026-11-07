#include "OpenUIRegExp.h"
#include "Prefix.h"
#include "vendor/libregexp.h"
#include <stdbool.h>
#include <stdint.h>
#include <stdlib.h>
#include <limits.h>
#include <stddef.h>

typedef union { max_align_t align; size_t size; } Allocation;
typedef struct { uintptr_t stack_start; size_t allocated; int interrupts; bool exhausted; } Context;
#define MEMORY_LIMIT (8u * 1024u * 1024u)
#define STACK_LIMIT (256u * 1024u)

bool lre_check_stack_overflow(void *opaque, size_t requested) {
    Context *ctx = opaque;
    uintptr_t current = (uintptr_t)&ctx;
    size_t delta = current > ctx->stack_start ? current - ctx->stack_start : ctx->stack_start - current;
    if (delta > STACK_LIMIT || requested > STACK_LIMIT - delta) { ctx->exhausted = true; return true; }
    return false;
}
int lre_check_timeout(void *opaque) {
    Context *ctx = opaque;
    if (++ctx->interrupts > 1000) { ctx->exhausted = true; return 1; }
    return 0;
}
void *lre_realloc(void *opaque, void *ptr, size_t size) {
    Context *ctx = opaque;
    Allocation *old = ptr ? ((Allocation *)ptr) - 1 : NULL;
    size_t previous = old ? old->size : 0;
    if (size == 0) { ctx->allocated -= previous; free(old); return NULL; }
    if (size > MEMORY_LIMIT || ctx->allocated - previous > MEMORY_LIMIT - size) { ctx->exhausted = true; return NULL; }
    Allocation *next = realloc(old, sizeof(Allocation) + size);
    if (!next) { ctx->exhausted = true; return NULL; }
    next->size = size; ctx->allocated = ctx->allocated - previous + size;
    return next + 1;
}
int openui_regexp_test(const uint16_t *pattern, size_t pattern_length, const uint16_t *value, size_t value_length) {
    Context ctx = {0}; ctx.stack_start = (uintptr_t)&ctx;
    if (pattern_length > 65536 || value_length > 1048576 || (pattern_length && !pattern) || (value_length && !value)) return -2;
    /* CESU-8: non-Unicode RegExp parses each surrogate as a separate atom.
       Converting through Swift String or ordinary UTF-8 would lose this. */
    unsigned char *encoded = lre_realloc(&ctx, NULL, pattern_length * 3 + 1);
    if (!encoded) return -2;
    size_t length = 0;
    for (size_t i = 0; i < pattern_length; ++i) {
        uint16_t c = pattern[i];
        if (c < 0x80) encoded[length++] = (unsigned char)c;
        else if (c < 0x800) { encoded[length++] = 0xC0 | (c >> 6); encoded[length++] = 0x80 | (c & 63); }
        else { encoded[length++] = 0xE0 | (c >> 12); encoded[length++] = 0x80 | ((c >> 6) & 63); encoded[length++] = 0x80 | (c & 63); }
    }
    encoded[length] = 0;
    char error[128]; int bytecode_length = 0;
    uint8_t *bytecode = lre_compile(&bytecode_length, error, sizeof(error), (char *)encoded, length, 0, &ctx);
    lre_realloc(&ctx, encoded, 0);
    if (!bytecode) return ctx.exhausted ? -2 : -1;
    /* The VM also uses temporary slots after capture pairs for quantifiers.
       Its allocation contract is lre_get_alloc_count, not capture_count * 2. */
    size_t captures = (size_t)lre_get_alloc_count(bytecode);
    uint8_t **capture = lre_realloc(&ctx, NULL, captures * sizeof(*capture));
    if (!capture) { lre_realloc(&ctx, bytecode, 0); return -2; }
    for (size_t i = 0; i < captures; ++i) capture[i] = NULL;
    uint16_t empty = 0;
    int result = lre_exec(capture, bytecode, (const uint8_t *)(value ? value : &empty), 0, (int)value_length, 1, &ctx);
    lre_realloc(&ctx, capture, 0); lre_realloc(&ctx, bytecode, 0);
    return result < 0 ? -2 : result;
}
