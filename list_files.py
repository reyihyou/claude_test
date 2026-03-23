#!/usr/bin/env python3
"""
列出指定文件夹下文件的文件名、创建时间和文件大小。
用法: python list_files.py [文件夹路径]
"""

import os
import sys
import time
from pathlib import Path

def list_files_in_directory(directory_path):
    """列出目录中所有文件的详细信息"""
    try:
        path = Path(directory_path)
        if not path.exists():
            print(f"错误: 路径 '{directory_path}' 不存在")
            return False
        if not path.is_dir():
            print(f"错误: '{directory_path}' 不是目录")
            return False

        print(f"扫描目录: {path.absolute()}")
        print("-" * 80)
        print(f"{'文件名':<40} {'创建时间':<25} {'文件大小(bytes)':>15}")
        print("-" * 80)

        file_count = 0
        total_size = 0

        # 遍历目录中的所有条目
        for item in path.iterdir():
            if item.is_file():
                try:
                    # 获取文件信息
                    file_name = item.name
                    create_time = time.ctime(item.stat().st_ctime)  # 创建时间
                    file_size = item.stat().st_size  # 文件大小(bytes)

                    # 打印文件信息
                    print(f"{file_name:<40} {create_time:<25} {file_size:>15,}")

                    file_count += 1
                    total_size += file_size
                except (OSError, PermissionError) as e:
                    print(f"{item.name:<40} {'权限错误或无法访问':<25} {'N/A':>15}")

        print("-" * 80)
        print(f"总计: {file_count} 个文件, 总大小: {total_size:,} bytes ({total_size/1024:.2f} KB)")

        return True

    except Exception as e:
        print(f"发生错误: {e}")
        return False

def main():
    # 获取命令行参数
    if len(sys.argv) > 1:
        directory = sys.argv[1]
    else:
        directory = "."  # 默认当前目录

    # 列出文件
    success = list_files_in_directory(directory)

    # 返回适当的退出代码
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()