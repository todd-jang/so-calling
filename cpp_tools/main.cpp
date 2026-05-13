#include <iostream>
#include <fstream>

// AutoCAD LISP (.lsp) Generator
void generateLispScript() {
    std::ofstream out("stud_generator.lsp");
    if (!out) {
        std::cerr << "Failed to create LISP file.\n";
        return;
    }
    
    out << "; AutoCAD LISP for 16-inch Stud Placement\n";
    out << "(defun c:STUD ( / p1 p2 ang dist count)\n";
    out << "  (setq p1 (getpoint \"\\n벽 시작점 클릭: \"))\n";
    out << "  (setq p2 (getpoint p1 \"\\n벽 끝점 클릭: \"))\n";
    out << "  (setq ang (angle p1 p2))\n";
    out << "  (setq dist (distance p1 p2))\n";
    out << "  (setq count 0)\n\n";
    
    out << "  ; 406mm(16인치) 간격으로 반복 생성\n";
    out << "  (while (<= (* count 406) dist)\n";
    out << "    (command \"_.RECTANG\" \n";
    out << "      (polar p1 ang (* count 406)) \n";
    out << "      (polar (polar p1 ang (+ (* count 406) 38)) (+ ang (/ pi 2)) 89) ; 2x4 규격 예시\n";
    out << "    )\n";
    out << "    (setq count (1+ count))\n";
    out << "  )\n";
    out << "  (princ)\n";
    out << ")\n";
    out << "(princ \"\\nLoad complete. Type 'STUD' to start.\")\n";
    
    out.close();
    std::cout << "[+] Generated AutoCAD LISP: stud_generator.lsp\n";
}

// MaxScript (.ms) Generator for Bricks
void generateMaxScript(int wallLengthBricks, int wallHeightBricks) {
    std::ofstream out("build_bricks.ms");
    if (!out) {
        std::cerr << "Failed to create MaxScript file.\n";
        return;
    }
    
    out << "-- MaxScript to generate Texas-style brick wall\n";
    out << "-- Run this in 3ds Max via Scripting -> Run Script\n\n";
    out << "fn createBrickWall length height = (\n";
    out << "    for h = 0 to (height-1) do (\n";
    out << "        for i = 0 to (length-1) do (\n";
    out << "            b = box length:10 width:20 height:5\n";
    out << "            offset = if (mod h 2 == 0) then 0 else 10\n";
    out << "            b.pos = [i * 21 + offset, 0, h * 6]\n";
    out << "            b.materialID = (random 1 5)\n";
    out << "        )\n";
    out << "    )\n";
    out << ")\n\n";
    out << "createBrickWall " << wallLengthBricks << " " << wallHeightBricks << "\n";
    out.close();
    std::cout << "[+] Generated MaxScript: build_bricks.ms (" 
              << (wallLengthBricks * wallHeightBricks) << " bricks)\n";
}

int main() {
    std::cout << "========================================\n";
    std::cout << " ArchPipeline Generator (C++ Bridge)\n";
    std::cout << "========================================\n\n";
    
    // Generate LISP Script instead of .scr
    generateLispScript();
    
    // Parameters for 3ds Max (Exterior)
    int brickCols = 20;
    int brickRows = 15;
    generateMaxScript(brickCols, brickRows);
    
    std::cout << "\n[!] Process Complete.\n";
    std::cout << "-> Import 'stud_generator.lsp' to AutoCAD (APPLOAD).\n";
    std::cout << "-> Import 'build_bricks.ms' to 3ds Max.\n";
    
    return 0;
}
