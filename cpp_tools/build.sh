#!/bin/bash

# ANSI Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}>>> Compiling C++ ArchPipeline Generator...${NC}"

# Compile using clang++ (Standard on Mac)
clang++ -std=c++17 main.cpp -o arch_gen

if [ $? -eq 0 ]; then
    echo -e "${GREEN}>>> Compilation successful!${NC}"
    echo -e "${BLUE}>>> Running generator...${NC}\n"
    
    # Run the compiled binary
    ./arch_gen
    
    echo -e "\n${GREEN}>>> Script files created in the current directory.${NC}"
    echo "Check 'build_studs.scr' and 'build_bricks.ms'"
else
    echo -e "\n\033[0;31m[!] Compilation failed. Please check the C++ source code.\033[0m"
fi
