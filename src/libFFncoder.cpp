// file: XorCrypto.cpp
// 独立的加密/解密算法模块，无标准库依赖
// 可无缝集成到 Android Studio JNI 中

// 使用 extern "C" 确保 C 兼容性，方便 JNI 调用
#ifdef __cplusplus
extern "C" {
#endif

// ============= 类型定义 =============
// 不使用标准库，自定义简单类型
typedef unsigned char byte;
typedef unsigned int uint32;

// ============= 线性同余随机数生成器 =============
// Windows 兼容的线性同余生成器
static uint32 xor_seed = 1;

// 设置种子（与 Windows srand 兼容）
static void xor_srand(uint32 seed) {
    xor_seed = seed;
}

// 生成 0-32767 的随机数（与 Windows rand 兼容）
static int xor_rand() {
    xor_seed = xor_seed * 214013 + 2531011;
    return (xor_seed >> 16) & 0x7FFF;
}

// 生成 0-255 的随机字节（用于异或操作）
static byte xor_rand_byte() {
    xor_seed = xor_seed * 214013 + 2531011;
    return (xor_seed >> 16) & 0xFF;
}

// ============= 核心加密/解密算法 =============
// 注意：加密和解密使用相同的算法，所以只需要一个函数
// 但按照您的要求，提供两个函数名以便于 Java 调用

/**
 * 加密函数
 * @param input 输入数据指针
 * @param output 输出数据指针（需要预先分配足够空间）
 * @param length 数据长度（字节数）
 * @param seed 随机数种子（0-32767）
 */
void Fencode(const byte* input, byte* output, int length, int seed) {
    // 设置随机数种子
    xor_srand(seed);
    
    // 生成随机序列并执行异或加密
    for (int i = 0; i < length; i++) {
        output[i] = input[i] ^ xor_rand_byte();
    }
}

/**
 * 解密函数
 * @param input 输入数据指针（加密后的数据）
 * @param output 输出数据指针（需要预先分配足够空间）
 * @param length 数据长度（字节数）
 * @param seed 随机数种子（必须与加密时相同）
 */
void Fdecode(const byte* input, byte* output, int length, int seed) {
    // 注意：解密使用完全相同的算法
    // 因为异或操作的特性：A ^ B ^ B = A
    Fencode(input, output, length, seed);
}

// 辅助函数：计算文件大小（如果需要）
int get_file_size(const char* filename) {
    // 这个函数需要平台特定的实现
    // 在 Android JNI 中，应该在 Java 层获取文件大小
    return -1;
}

#ifdef __cplusplus
}
#endif